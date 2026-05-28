# panel/api/admin.py
import asyncio
import json
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth import run_cmd, check_admin_group, require_role, log_admin_action
from config import ROLES_FILE, AD_ADMIN_GROUP, ADMIN_ACTION_LOG

router = APIRouter()
VALID_ROLES = {"superadmin", "operador", "readonly"}
_roles_lock = asyncio.Lock()


def _load_roles() -> dict:
    if os.path.exists(ROLES_FILE):
        try:
            with open(ROLES_FILE) as f:
                return json.load(f)
        except (IOError, ValueError):
            pass
    return {}


def _save_roles(roles: dict) -> None:
    """Atomically write roles.json via a temp file + os.replace."""
    tmp = ROLES_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(roles, f, indent=2)
    os.replace(tmp, ROLES_FILE)


@router.get("")
async def admin_config():
    stdout, _ = run_cmd(["getent", "group", AD_ADMIN_GROUP])
    if not stdout:
        group_name = AD_ADMIN_GROUP.split("\\")[-1]
        stdout, _ = run_cmd(["getent", "group", group_name])
    members = []
    if stdout:
        parts = stdout.split(":")
        if len(parts) >= 4 and parts[3]:
            members = [m.strip() for m in parts[3].split(",") if m.strip()]
    roles = _load_roles()
    admins = []
    for m in members:
        gn_out, _ = run_cmd(["getent", "passwd", m])
        fullname = gn_out.split(":")[4].split(",")[0] if gn_out else m
        admins.append({"username": m, "fullname": fullname, "role": roles.get(m, "readonly")})
    action_log = []
    if os.path.exists(ADMIN_ACTION_LOG):
        with open(ADMIN_ACTION_LOG) as f:
            lines = f.readlines()
        action_log = [line.strip() for line in reversed(lines[-50:])]
    return {
        "admins": admins,
        "action_log": action_log,
        "ad_group": AD_ADMIN_GROUP,
        "note": "Para adicionar/remover admins, edite o grupo no AD (Windows Server)",
    }


class RoleUpdate(BaseModel):
    username: str
    role: str


@router.post("/role")
async def update_role(req: RoleUpdate, user: dict = Depends(require_role("superadmin"))):
    if req.role not in VALID_ROLES:
        raise HTTPException(400, f"Role inválida. Opções: {', '.join(sorted(VALID_ROLES))}")
    if not check_admin_group(req.username):
        raise HTTPException(400, "Usuário não é membro do grupo AD Administradores")
    async with _roles_lock:
        roles = _load_roles()
        roles[req.username] = req.role
        _save_roles(roles)
    log_admin_action(user["sub"], f"ROLE UPDATE: {req.username} -> {req.role}")
    return {"ok": True}
