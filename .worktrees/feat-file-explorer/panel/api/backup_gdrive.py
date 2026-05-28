# panel/api/backup_gdrive.py
import os
import subprocess
from fastapi import APIRouter, Depends, HTTPException
from auth import run_cmd, require_role, log_admin_action
from config import BACKUP_GDRIVE_LOG, BACKUP_GDRIVE_SCRIPT
from parsers import parse_backup_gdrive_log

router = APIRouter()

_PID_FILE    = "/tmp/labsrv-backup-gdrive.pid"
_CRON_ENTRY  = "0 23 * * * bash /home/admin/labsrvfiles/scripts/backup-to-gdrive.sh >> /home/admin/backup-to-gdrive.log 2>&1"
_CRON_MARKER = "backup-to-gdrive.sh"


def _crontab_lines() -> list[str]:
    result = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
    return result.stdout.splitlines() if result.returncode == 0 else []


def _crontab_set(lines: list[str]) -> None:
    new_crontab = "\n".join(lines) + "\n"
    subprocess.run(["crontab", "-"], input=new_crontab, text=True)


@router.get("")
async def backup_gdrive_status(user: dict = Depends(require_role("readonly", "operador", "superadmin"))):
    text = ""
    if os.path.exists(BACKUP_GDRIVE_LOG):
        with open(BACKUP_GDRIVE_LOG, "r", errors="replace") as f:
            text = f.read()

    data = parse_backup_gdrive_log(text)
    pids_out, _ = run_cmd(["pgrep", "-f", "backup-to-gdrive.sh"])
    data["process_running"] = bool(pids_out.strip())

    lines = _crontab_lines()
    cron_line = next((l for l in lines if _CRON_MARKER in l and not l.startswith("#")), "")
    data["cron_active"] = bool(cron_line)
    data["cron_line"]   = cron_line
    log_lines = text.splitlines()
    data["log_tail"]    = "\n".join(log_lines[-60:]) if log_lines else ""
    data["log_exists"]  = bool(text.strip())
    return data


@router.post("/run")
async def backup_gdrive_run(user: dict = Depends(require_role("superadmin"))):
    if not os.path.isfile(BACKUP_GDRIVE_SCRIPT):
        raise HTTPException(500, f"Script não encontrado: {BACKUP_GDRIVE_SCRIPT}")
    pids_out, _ = run_cmd(["pgrep", "-f", "backup-to-gdrive.sh"])
    if pids_out.strip():
        raise HTTPException(409, "Backup GDrive já está rodando")
    log_f = open(BACKUP_GDRIVE_LOG, "a")
    proc = subprocess.Popen(
        ["bash", BACKUP_GDRIVE_SCRIPT],
        stdout=log_f, stderr=log_f,
        start_new_session=True, close_fds=True,
    )
    try:
        with open(_PID_FILE, "w") as f:
            f.write(str(proc.pid))
    except OSError:
        pass
    log_admin_action(user["sub"], "BACKUP→GDRIVE INICIADO via painel")
    return {"ok": True, "message": "Backup → GDrive iniciado em background"}


@router.post("/run-dry")
async def backup_gdrive_dry(user: dict = Depends(require_role("superadmin"))):
    if not os.path.isfile(BACKUP_GDRIVE_SCRIPT):
        raise HTTPException(500, f"Script não encontrado: {BACKUP_GDRIVE_SCRIPT}")
    pids_out, _ = run_cmd(["pgrep", "-f", "backup-to-gdrive.sh"])
    if pids_out.strip():
        raise HTTPException(409, "Backup GDrive já está rodando")
    env = {**os.environ, "DRY_RUN": "1"}
    log_f = open(BACKUP_GDRIVE_LOG, "a")
    subprocess.Popen(
        ["bash", BACKUP_GDRIVE_SCRIPT],
        stdout=log_f, stderr=log_f,
        start_new_session=True, close_fds=True,
        env=env,
    )
    log_admin_action(user["sub"], "BACKUP→GDRIVE DRY-RUN via painel")
    return {"ok": True, "message": "Dry-run iniciado — nenhum arquivo será alterado"}


@router.post("/parar")
async def backup_gdrive_parar(user: dict = Depends(require_role("superadmin"))):
    run_cmd(["pkill", "-f", "backup-to-gdrive.sh"])
    run_cmd(["pkill", "-f", "rclone sync.*gdrive-labsobral"])
    try:
        os.unlink(_PID_FILE)
    except OSError:
        pass
    log_admin_action(user["sub"], "BACKUP→GDRIVE PARADO via painel")
    return {"ok": True, "message": "Backup GDrive parado"}


@router.post("/cron/ativar")
async def cron_ativar(user: dict = Depends(require_role("superadmin"))):
    lines = [l for l in _crontab_lines() if _CRON_MARKER not in l]
    lines.append(_CRON_ENTRY)
    _crontab_set(lines)
    log_admin_action(user["sub"], "BACKUP→GDRIVE CRON ATIVADO (23h diário)")
    return {"ok": True, "message": "Cron ativado: 23h diário"}


@router.post("/cron/desativar")
async def cron_desativar(user: dict = Depends(require_role("superadmin"))):
    lines = [l for l in _crontab_lines() if _CRON_MARKER not in l]
    _crontab_set(lines)
    log_admin_action(user["sub"], "BACKUP→GDRIVE CRON DESATIVADO")
    return {"ok": True, "message": "Cron desativado"}
