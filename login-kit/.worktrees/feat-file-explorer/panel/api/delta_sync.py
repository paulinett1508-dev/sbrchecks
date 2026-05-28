# panel/api/delta_sync.py
import os
import subprocess
from fastapi import APIRouter, Depends, HTTPException
from auth import run_cmd, require_role, log_admin_action
from config import DELTA_SYNC_LOG, DELTA_SYNC_SCRIPT
from parsers import parse_delta_sync_log

router = APIRouter()

_PID_FILE = "/tmp/labsrv-deltasync.pid"


@router.get("")
async def delta_sync_status(user: dict = Depends(require_role("readonly", "operador", "superadmin"))):
    text = ""
    if os.path.exists(DELTA_SYNC_LOG):
        with open(DELTA_SYNC_LOG, "r", errors="replace") as f:
            text = f.read()

    data = parse_delta_sync_log(text)
    pids_out, _ = run_cmd(["pgrep", "-f", "delta-sync.sh"])
    data["process_running"] = bool(pids_out.strip())
    lines = text.splitlines()
    data["log_tail"] = "\n".join(lines[-60:]) if lines else ""
    data["log_exists"] = bool(text.strip())
    return data


@router.post("/iniciar")
async def delta_iniciar(user: dict = Depends(require_role("superadmin"))):
    if not os.path.isfile(DELTA_SYNC_SCRIPT):
        raise HTTPException(500, f"Script não encontrado: {DELTA_SYNC_SCRIPT}")
    pids_out, _ = run_cmd(["pgrep", "-f", "delta-sync.sh"])
    if pids_out.strip():
        raise HTTPException(409, "Delta-sync já está rodando")
    with open(DELTA_SYNC_LOG, "a") as log_f:
        proc = subprocess.Popen(
            ["bash", DELTA_SYNC_SCRIPT],
            stdout=log_f, stderr=log_f,
            start_new_session=True, close_fds=True,
        )
    try:
        with open(_PID_FILE, "w") as f:
            f.write(str(proc.pid))
    except OSError:
        pass
    log_admin_action(user["sub"], "DELTA-SYNC INICIADO via painel")
    return {"ok": True, "message": "Delta-sync iniciado em background"}


@router.post("/parar")
async def delta_parar(user: dict = Depends(require_role("superadmin"))):
    run_cmd(["pkill", "-f", "delta-sync.sh"])
    run_cmd(["pkill", "-f", "rclone sync.*gdrive-labsobral"])
    try:
        os.unlink(_PID_FILE)
    except OSError:
        pass
    log_admin_action(user["sub"], "DELTA-SYNC PARADO via painel")
    return {"ok": True, "message": "Delta-sync parado"}
