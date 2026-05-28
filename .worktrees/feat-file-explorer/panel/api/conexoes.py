# panel/api/conexoes.py
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from auth import run_cmd, require_role, log_admin_action

router = APIRouter()


@router.get("")
async def conexoes():
    out, _ = run_cmd(["smbstatus", "-j"])
    try:
        return json.loads(out)
    except Exception:
        return {"sessions": {}, "shares": {}, "locked_files": {}}


class DisconnectReq(BaseModel):
    username: str


@router.post("/disconnect")
async def disconnect(req: DisconnectReq, user: dict = Depends(require_role("operador", "superadmin"))):
    _, err = run_cmd(["sudo", "smbcontrol", "smbd", "close-share", req.username])
    if err:
        pids_out, _ = run_cmd(["pgrep", "-u", req.username, "smbd"])
        for pid in pids_out.splitlines():
            pid = pid.strip()
            if pid.isdigit():
                run_cmd(["sudo", "/opt/labsrv-panel/bin/samba-hup-pid.sh", pid])
    log_admin_action(user["sub"], f"DISCONNECT USER: {req.username}")
    return {"ok": True}
