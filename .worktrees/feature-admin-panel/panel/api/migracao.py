# panel/api/migracao.py
import os
from fastapi import APIRouter
from auth import run_cmd
from config import MIGRATION_LOG, DELTA_SYNC_LOG, MIGRATION_DEST
from parsers import parse_migration_log

router = APIRouter()


def _folder_sizes() -> dict[str, str]:
    """Return {drive_name: human_size} for folders already on disk."""
    out, _ = run_cmd(["du", "-sh", "--max-depth=1", MIGRATION_DEST])
    sizes = {}
    for line in out.splitlines():
        parts = line.split("\t", 1)
        if len(parts) == 2:
            size, path = parts
            name = os.path.basename(path.rstrip("/"))
            if name and name != os.path.basename(MIGRATION_DEST):
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


@router.get("")
async def migracao():
    text = ""
    if os.path.exists(MIGRATION_LOG):
        with open(MIGRATION_LOG, "r", errors="replace") as f:
            text = f.read()

    data = parse_migration_log(text)

    pids_out, _ = run_cmd(["pgrep", "-f", "migrate-gdrive-all"])
    data["process_running"] = bool(pids_out.strip())

    df_out, _ = run_cmd(["df", "-h", "--output=avail,pcent", "/mnt/hdd3"])
    lines = df_out.splitlines()
    if len(lines) > 1:
        parts = lines[1].split()
        data["disk_free"]    = parts[0] if parts else "?"
        data["disk_percent"] = int(parts[1].rstrip("%")) if len(parts) > 1 else 0
    else:
        data["disk_free"]    = "?"
        data["disk_percent"] = 0

    data["folder_sizes"] = _folder_sizes()
    data["delta"]        = _delta_status()
    return data
