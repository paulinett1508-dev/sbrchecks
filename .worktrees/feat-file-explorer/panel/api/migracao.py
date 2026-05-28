# panel/api/migracao.py
import asyncio
import os
import signal
import subprocess
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from auth import run_cmd, require_role, log_admin_action
from config import MIGRATION_LOG, DELTA_SYNC_LOG, MIGRATION_DEST_SSD, MIGRATION_DEST_HDD, MIGRATION_DEST_HDD3, MIGRATION_DEST_EXTERNO
from parsers import parse_migration_log, ALL_DRIVES

router = APIRouter()

MIGRATION_SCRIPT  = os.path.expanduser("~/labsrvfiles/scripts/migrate-gdrive-all.sh")
MIGRATION_PID_FILE = "/tmp/labsrv-migration.pid"


def _folder_sizes() -> dict[str, str]:
    """Return {drive_name: human_size} for folders already on disk (SSD + HDD)."""
    sizes = {}
    for base in (MIGRATION_DEST_SSD, MIGRATION_DEST_HDD, MIGRATION_DEST_HDD3, MIGRATION_DEST_EXTERNO):
        out, _ = run_cmd(["du", "-sh", "--max-depth=1", base])
        for line in out.splitlines():
            parts = line.split("\t", 1)
            if len(parts) == 2:
                size, path = parts
                name = os.path.basename(path.rstrip("/"))
                if name and name != os.path.basename(base):
                    sizes[name] = size.strip()
    return sizes


def _delta_status() -> dict:
    """Parse delta-sync log for done/error counts."""
    if not os.path.exists(DELTA_SYNC_LOG):
        return {"exists": False, "done": 0, "errors": 0, "running": False}
    with open(DELTA_SYNC_LOG, "r", errors="replace") as f:
        text = f.read()
    done   = text.count("<<< DELTA-OK:")
    errors = text.count("<<< DELTA-ERRO")
    running_out, _ = run_cmd(["pgrep", "-f", "delta-sync"])
    return {
        "exists":  True,
        "done":    done,
        "errors":  errors,
        "running": bool(running_out.strip()),
    }


def _stop_migration():
    """Kill migration process group using PID file; fallback to pkill."""
    stopped = False
    if os.path.exists(MIGRATION_PID_FILE):
        try:
            with open(MIGRATION_PID_FILE) as f:
                pid = int(f.read().strip())
            os.killpg(pid, signal.SIGTERM)
            stopped = True
        except (ValueError, ProcessLookupError, OSError):
            pass
        finally:
            try:
                os.unlink(MIGRATION_PID_FILE)
            except OSError:
                pass
    if not stopped:
        run_cmd(["pkill", "-f", "migrate-gdrive-all.sh"])
        run_cmd(["pkill", "-f", "rclone copy.*gdrive-labsobral"])


def _start_migration():
    """Start the migration script detached from the panel process."""
    if not os.path.isfile(MIGRATION_SCRIPT):
        raise HTTPException(500, f"Script não encontrado: {MIGRATION_SCRIPT}")
    with open(MIGRATION_LOG, "a") as log_f:
        proc = subprocess.Popen(
            ["bash", MIGRATION_SCRIPT],
            stdout=log_f,
            stderr=log_f,
            start_new_session=True,
            close_fds=True,
        )
    # Salva PID para gerenciamento preciso (bash script também escreve em PID_FILE via trap)
    try:
        with open(MIGRATION_PID_FILE, "w") as f:
            f.write(str(proc.pid))
    except OSError:
        pass


def _migration_disks() -> list:
    result = []
    for label, path in [("SSD", MIGRATION_DEST_SSD), ("HDD", MIGRATION_DEST_HDD),
                        ("HDD3", MIGRATION_DEST_HDD3), ("EXTERNO", MIGRATION_DEST_EXTERNO)]:
        df_out, _ = run_cmd(["df", "-h", "--output=size,avail,pcent", path])
        lines = df_out.splitlines()
        if len(lines) > 1:
            parts = lines[1].split()
            result.append({
                "label":   label,
                "mount":   path,
                "size":    parts[0] if parts else "?",
                "free":    parts[1] if len(parts) > 1 else "?",
                "percent": int(parts[2].rstrip("%")) if len(parts) > 2 else 0,
            })
        else:
            result.append({"label": label, "mount": path, "size": "?", "free": "?", "percent": 0})
    return result


@router.get("")
async def migracao(user: dict = Depends(require_role("readonly", "operador", "superadmin"))):
    text = ""
    if os.path.exists(MIGRATION_LOG):
        with open(MIGRATION_LOG, "r", errors="replace") as f:
            text = f.read()

    data = parse_migration_log(text)

    pids_out, _ = run_cmd(["pgrep", "-f", "migrate-gdrive-all"])
    data["process_running"] = bool(pids_out.strip())

    migration_disks, folder_sizes, delta = await asyncio.gather(
        asyncio.to_thread(_migration_disks),
        asyncio.to_thread(_folder_sizes),
        asyncio.to_thread(_delta_status),
    )
    data["migration_disks"] = migration_disks
    # TODO: remover quando frontend não usar mais disk_free/disk_percent
    ssd = migration_disks[0] if migration_disks else {}
    data["disk_free"]    = ssd.get("free", "?")
    data["disk_percent"] = ssd.get("percent", 0)
    data["folder_sizes"] = folder_sizes
    data["delta"]        = delta
    return data


@router.post("/reiniciar")
async def migracao_reiniciar(user: dict = Depends(require_role("superadmin"))):
    """Mata todos os processos de migração e reinicia do ponto onde parou."""
    _stop_migration()
    await asyncio.sleep(3)
    _start_migration()
    log_admin_action(user["sub"], "MIGRAÇÃO REINICIADA via painel")
    return {"ok": True, "message": "Migração reiniciada"}


@router.post("/parar")
async def migracao_parar(user: dict = Depends(require_role("superadmin"))):
    """Para a migração sem reiniciar."""
    _stop_migration()
    log_admin_action(user["sub"], "MIGRAÇÃO PARADA via painel")
    return {"ok": True, "message": "Migração parada"}


@router.post("/pular/{drive}")
async def migracao_pular(drive: str, user: dict = Depends(require_role("superadmin"))):
    """Marca um drive como concluído no log para que o script o ignore na próxima execução."""
    if drive not in ALL_DRIVES:
        raise HTTPException(400, f"Drive desconhecido: {drive}")
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(MIGRATION_LOG, "a") as f:
        f.write(f"[{ts}] <<< CONCLUÍDO: {drive}\n")
    log_admin_action(user["sub"], f"DRIVE PULADO: {drive}")
    return {"ok": True, "message": f"Drive {drive} marcado como concluído (pulado)"}
