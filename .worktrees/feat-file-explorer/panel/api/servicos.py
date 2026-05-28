# panel/api/servicos.py
from fastapi import APIRouter, Depends, HTTPException
from auth import run_cmd, require_role, log_admin_action
from config import SERVICES

router = APIRouter()


def _svc_info(name: str) -> dict:
    status_out, _ = run_cmd(["systemctl", "is-active", name])
    show_out, _ = run_cmd(
        ["systemctl", "show", name, "--property=ActiveEnterTimestamp,MainPID"]
    )
    props = {}
    for line in show_out.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            props[k] = v
    return {
        "name": name,
        "active": status_out == "active",
        "status": status_out,
        "pid": props.get("MainPID", ""),
        "since": props.get("ActiveEnterTimestamp", ""),
    }


@router.get("")
async def servicos():
    return {"services": [_svc_info(s) for s in SERVICES]}


@router.get("/{name}/logs")
async def svc_logs(name: str):
    if name not in SERVICES:
        raise HTTPException(404, "Serviço não encontrado")
    out, _ = run_cmd(
        ["journalctl", "-u", name, "-n", "30", "--no-pager", "--output=short"]
    )
    return {"logs": out}


@router.post("/{name}/restart")
async def restart_svc(name: str, user: dict = Depends(require_role("operador", "superadmin"))):
    if name not in SERVICES:
        raise HTTPException(404, "Serviço não encontrado")
    _, err = run_cmd(["sudo", "systemctl", "restart", name])
    log_admin_action(user["sub"], f"RESTART SERVICE: {name}")
    return {"ok": not bool(err), "error": err}
