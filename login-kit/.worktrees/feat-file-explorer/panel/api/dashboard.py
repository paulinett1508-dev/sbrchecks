# panel/api/dashboard.py
import asyncio
import json
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from auth import run_cmd
from config import SERVICES, DISK_ALERT_FILE, DISK_ALERT_THRESHOLD
from api.discos import _real_mounts

router = APIRouter()


def _get_services():
    result = []
    for svc in SERVICES:
        out, _ = run_cmd(["systemctl", "is-active", svc])
        result.append({"name": svc, "active": out == "active", "status": out})
    return result


def _get_disks():
    out, _ = run_cmd(["df", "--output=source,target,size,used,avail,pcent", "-h"] + _real_mounts())
    disks = []
    for line in out.splitlines()[1:]:
        parts = line.split()
        if len(parts) < 6:
            continue
        disks.append({
            "device": parts[0], "mount": parts[1],
            "size": parts[2], "used": parts[3],
            "avail": parts[4], "percent": int(parts[5].rstrip("%"))
        })
    return disks


def _get_disk_alerts():
    if not os.path.exists(DISK_ALERT_FILE):
        # fallback: compute live from df if alert file doesn't exist yet
        disks = _get_disks()
        return [d for d in disks if d["percent"] >= DISK_ALERT_THRESHOLD]
    try:
        with open(DISK_ALERT_FILE) as f:
            data = json.load(f)
        return data.get("alerts", [])
    except Exception:
        return []


def _get_connections():
    out, _ = run_cmd(["smbstatus", "-j"])
    try:
        data = json.loads(out)
        sessions = data.get("sessions", {})
        result = []
        for sid, info in sessions.items():
            username = (info.get("username", "") or "").split("\\")[-1].split("@")[0]
            fullname_out, _ = run_cmd(["getent", "passwd", username])
            fullname = fullname_out.split(":")[4].split(",")[0] if fullname_out else username
            group_out, _ = run_cmd(["id", "-gn", username])
            result.append({
                "username": username,
                "fullname": fullname or username,
                "group": group_out or "",
                "share": info.get("share", ""),
                "ip": info.get("machine", ""),
                "duration": str(info.get("connected_at", "")),
                "warn": False,
            })
        return result
    except Exception:
        return []


def _proc_running(pattern: str) -> bool:
    out, _ = run_cmd(["pgrep", "-f", pattern])
    return bool(out.strip())


@router.get("/sse-topbar")
async def sse_topbar():
    from api.alertas import unread_count, refresh_disk_alerts
    async def gen():
        tick = 0
        while True:
            svcs  = await asyncio.to_thread(_get_services)
            if tick % 3 == 0:
                await asyncio.to_thread(refresh_disk_alerts)
            count  = await asyncio.to_thread(unread_count)
            delta  = await asyncio.to_thread(_proc_running, "delta-sync.sh")
            bkgdrv = await asyncio.to_thread(_proc_running, "backup-to-gdrive.sh")
            payload = {
                "services":              svcs,
                "alert_count":           count,
                "delta_running":         delta,
                "backup_gdrive_running": bkgdrv,
            }
            yield f"data: {json.dumps(payload)}\n\n"
            tick += 1
            await asyncio.sleep(10)
    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("")
async def dashboard_data():
    disks = _get_disks()
    return {
        "services": _get_services(),
        "disks": disks,
        "connections": _get_connections(),
        "disk_alerts": _get_disk_alerts(),
    }
