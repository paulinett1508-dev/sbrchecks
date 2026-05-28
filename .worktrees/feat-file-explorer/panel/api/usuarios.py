# panel/api/usuarios.py
import base64
import os
import subprocess
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from auth import run_cmd

router = APIRouter()

AD_CREDS_FILE = "/home/admin/.ad-creds"
AD_HOST = "ldap://192.86.221.218"
AD_BASE = "DC=labsobralnet,DC=ind"
AD_FILTER = "(&(objectClass=user)(!(objectClass=computer))(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"
AD_ATTRS = ["sAMAccountName", "displayName", "department", "lastLogonTimestamp"]

# Windows FILETIME epoch offset (100-ns intervals from 1601-01-01 to 1970-01-01)
_WIN_EPOCH_OFFSET = 116444736000000000


def _filetime_to_str(ft_str: str) -> str:
    try:
        ft = int(ft_str)
        if ft == 0:
            return ""
        ts = (ft - _WIN_EPOCH_OFFSET) / 10_000_000
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return ""


def _load_ad_creds() -> tuple[str, str] | None:
    try:
        raw = open(AD_CREDS_FILE).read().strip()
        user, _, pwd = raw.partition(":")
        return user.strip(), pwd.strip()
    except Exception:
        return None


def _ldap_users() -> list[dict] | None:
    creds = _load_ad_creds()
    if not creds:
        return None
    user, pwd = creds
    try:
        result = subprocess.run(
            ["ldapsearch", "-x", "-H", AD_HOST,
             "-D", user, "-w", pwd,
             "-b", AD_BASE, AD_FILTER] + AD_ATTRS,
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode != 0:
            return None
        users = []
        _ATTRS = {"sAMAccountName", "displayName", "department", "lastLogonTimestamp"}
        _SKIP = {"#", "search:", "result:", "numResponses:", "numEntries:", "ref:"}
        cur: dict = {}
        for line in result.stdout.splitlines():
            if line.startswith("dn:") and cur:
                if cur.get("sAMAccountName"):
                    users.append(cur)
                cur = {}
                continue
            if not line or any(line.startswith(s) for s in _SKIP):
                continue
            # LDIF: "attr: value" (plain) or "attr:: base64value" (encoded)
            if "::" in line:
                k, _, b64 = line.partition("::")
                k = k.strip()
                if k in _ATTRS:
                    try:
                        cur[k] = base64.b64decode(b64.strip()).decode("utf-8", errors="replace")
                    except Exception:
                        cur[k] = b64.strip()
            elif ":" in line:
                k, _, v = line.partition(":")
                k, v = k.strip(), v.strip()
                if k in _ATTRS and v:
                    cur[k] = v
        if cur.get("sAMAccountName"):
            users.append(cur)
        return users
    except Exception:
        return None


def _wbinfo_users() -> list[str]:
    out, _ = run_cmd(["wbinfo", "-u"])
    return [u.strip() for u in out.splitlines() if u.strip()]


def _local_users() -> list[dict]:
    out, _ = run_cmd(["getent", "passwd"])
    users = []
    for line in out.splitlines():
        parts = line.split(":")
        if len(parts) < 7:
            continue
        uid = int(parts[2]) if parts[2].isdigit() else 0
        if uid < 1000 or uid > 65000:
            continue
        users.append({
            "username": parts[0],
            "fullname": parts[4].split(",")[0],
            "department": "",
            "type": "local",
        })
    return users


def _last_samba_access() -> dict[str, str]:
    """Returns {username: 'YYYY-MM-DD HH:MM'} from systemd journal smbd_audit."""
    try:
        result = subprocess.run(
            ["journalctl", "SYSLOG_IDENTIFIER=smbd_audit", "--no-pager", "-n", "50000",
             "--output=short-iso"],
            capture_output=True, text=True, timeout=15,
        )
        last: dict[str, str] = {}
        for line in result.stdout.splitlines():
            # Format: 2024-04-10T09:23:14+0000 hostname smbd_audit[PID]: user|ip|share|op|...
            try:
                ts_part, _, rest = line.partition(" ")
                msg_part = rest.split(": ", 1)[-1]
                fields = msg_part.split("|")
                if len(fields) < 3:
                    continue
                user = fields[0].strip()
                share = fields[2].strip()
                if not user or user in ("nobody", "root") or share in ("IPC$", "IPC_", ""):
                    continue
                # Parse ISO timestamp
                ts = ts_part[:16].replace("T", " ")
                if user not in last or ts > last[user]:
                    last[user] = ts
            except Exception:
                continue
        return last
    except Exception:
        return {}


@router.get("")
async def usuarios():
    ldap_users = _ldap_users()
    ldap_ok = ldap_users is not None
    samba_access = _last_samba_access()

    if ldap_ok:
        ad_users = [
            {
                "username": u.get("sAMAccountName", ""),
                "fullname": u.get("displayName", ""),
                "department": u.get("department", ""),
                "last_logon": samba_access.get(u.get("sAMAccountName", ""), ""),
                "type": "ad",
            }
            for u in ldap_users
            if u.get("sAMAccountName")
        ]
    else:
        usernames = _wbinfo_users()
        ad_users = [{"username": u, "fullname": "", "department": "",
                     "last_logon": samba_access.get(u, ""), "type": "ad"} for u in usernames]

    local_users = _local_users()
    all_users = (sorted(local_users, key=lambda u: u["username"]) +
                 sorted(ad_users, key=lambda u: u["username"]))

    return {
        "users": all_users,
        "total": len(all_users),
        "ad_count": len(ad_users),
        "local_count": len(local_users),
        "cache_ok": ldap_ok,
    }


@router.get("/{username}")
async def usuario_detalhe(username: str):
    if any(c in username for c in "/;|&`$"):
        raise HTTPException(status_code=400, detail="Username inválido")
    # Try DOMAIN\user format first (works even if not cached by SSSD)
    fqdn = f"{username}@labsobralnet.ind"
    groups_out, _ = run_cmd(["id", "-Gn", fqdn])
    if not groups_out:
        groups_out, _ = run_cmd(["id", "-Gn", username])
    groups = [g for g in groups_out.split() if g] if groups_out else []
    return {
        "username": username,
        "groups": groups,
    }
