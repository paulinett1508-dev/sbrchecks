# fileexplorer/auth.py
import logging
import re
import subprocess
import time

logger = logging.getLogger(__name__)

from fastapi import Depends, HTTPException, Request


def run_cmd(cmd: list[str], timeout: int = 10) -> tuple[str, str]:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.stderr.strip()
    except subprocess.TimeoutExpired:
        return "", f"timed out after {timeout}s"
    except Exception as e:
        return "", str(e)


def pam_authenticate(username: str, password: str) -> bool:
    try:
        import pam
        return pam.pam().authenticate(username, password, service="login")
    except ImportError as e:
        logger.error("pam module not installed: %s", e)
        return False


def create_token(username: str) -> str:
    import jwt
    from config import JWT_SECRET, JWT_EXPIRE_HOURS
    payload = {
        "sub": username,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    import jwt
    from config import JWT_SECRET
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None


def get_user_shares(username: str) -> list[dict]:
    """Returns [{name, root}] for shares the user can access via AD group membership."""
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from shared.share_groups import SHARE_GROUPS, SHARE_ROOTS

    stdout, _ = run_cmd(["id", username])
    if not stdout:
        return []
    user_groups = {g.lower() for g in re.findall(r'\(([^)]+)\)', stdout)}

    result = []
    for share, ad_group in SHARE_GROUPS.items():
        if share not in SHARE_ROOTS:
            continue  # skip local-user shares (COMERCIAL_VENDAS, LINKS_UTEIS)
        group_short = ad_group.split("\\")[-1].lower()
        if group_short in user_groups or ad_group.lower() in user_groups:
            result.append({"name": share, "root": SHARE_ROOTS[share]})

    try:
        from api.shares import get_received_shares
        result.extend(get_received_shares(username))
    except Exception:
        pass

    return result


def get_current_user(request: Request) -> dict:
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    return payload
