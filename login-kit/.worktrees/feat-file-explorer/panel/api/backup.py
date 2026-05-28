# panel/api/backup.py
import os
import subprocess
from fastapi import APIRouter, Depends
from auth import run_cmd, require_role, log_admin_action
from config import BACKUP_LOG
from parsers import parse_backup_log

router = APIRouter()


@router.get("")
async def backup():
    text = ""
    if os.path.exists(BACKUP_LOG):
        with open(BACKUP_LOG, "r", errors="replace") as f:
            text = f.read()
    entries = parse_backup_log(text)
    cron_out, _ = run_cmd(["crontab", "-l"])
    next_backup = ""
    for line in cron_out.splitlines():
        if "backup" in line.lower() and not line.startswith("#"):
            next_backup = line
            break
    return {"history": entries[:20], "next_cron": next_backup}


@router.post("/run")
async def run_backup(user: dict = Depends(require_role("superadmin"))):
    subprocess.Popen(
        ["bash", "-c",
         "rsync -av /srv/samba/ /mnt/hdd2/backups/ >> /var/log/backup-labsrv.log 2>&1"],
        close_fds=True,
    )
    log_admin_action(user["sub"], "BACKUP RSYNC INICIADO MANUALMENTE")
    return {"ok": True, "message": "Backup rsync iniciado em background"}
