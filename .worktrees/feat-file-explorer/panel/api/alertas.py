# panel/api/alertas.py
import json
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user, run_cmd
from config import ALERTS_FILE, DISK_ALERT_THRESHOLD
from api.discos import _real_mounts

router = APIRouter()


def _load() -> list:
    try:
        with open(ALERTS_FILE) as f:
            return json.load(f).get("alerts", [])
    except Exception:
        return []


def _save(alerts: list) -> None:
    os.makedirs(os.path.dirname(ALERTS_FILE), exist_ok=True)
    with open(ALERTS_FILE, "w") as f:
        json.dump({"alerts": alerts}, f, indent=2, default=str)


def unread_count() -> int:
    return sum(1 for a in _load() if not a["acknowledged"])


def refresh_disk_alerts() -> None:
    """Sync disk alerts with current df state. Silently no-ops on error."""
    try:
        out, _ = run_cmd(["df", "--output=source,target,avail,pcent", "-h"] + _real_mounts())
        live: dict = {}
        for line in out.splitlines()[1:]:
            parts = line.split()
            if len(parts) < 4:
                continue
            pct = int(parts[3].rstrip("%"))
            if pct >= DISK_ALERT_THRESHOLD:
                live[parts[1]] = {"device": parts[0], "avail": parts[2], "percent": pct}

        alerts = _load()
        now = datetime.now().isoformat(timespec="seconds")

        # When disk drops below threshold: auto-resolve unacknowledged alerts AND
        # mark user-acknowledged alerts as "cleared" so a future spike can create a new alert.
        for a in alerts:
            if a["type"] == "disk" and a["mount"] not in live:
                if not a["acknowledged"]:
                    a.update({"acknowledged": True, "ack_by": "sistema", "ack_at": now})
                a["cleared"] = True  # allows new alert if disk spikes again

        # Mounts with active unacknowledged alerts (update in place)
        active_mounts = {a["mount"] for a in alerts if a["type"] == "disk" and not a["acknowledged"]}

        # Mounts where user already ACKed and disk is still high (not yet cleared) — don't re-create
        user_acked_mounts = {
            a["mount"] for a in alerts
            if a["type"] == "disk" and a["acknowledged"]
            and a.get("ack_by") != "sistema"
            and not a.get("cleared", False)
        }

        for mount, info in live.items():
            pct = info["percent"]
            sev = "critical" if pct >= 90 else "warning"
            if mount in active_mounts:
                for a in alerts:
                    if a["type"] == "disk" and not a["acknowledged"] and a["mount"] == mount:
                        a.update({"percent": pct, "avail": info["avail"], "severity": sev, "updated_at": now})
            elif mount not in user_acked_mounts:
                alerts.append({
                    "id": f"disk{mount.replace('/', '-')}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "type": "disk",
                    "severity": sev,
                    "mount": mount,
                    "device": info["device"],
                    "percent": pct,
                    "avail": info["avail"],
                    "message": f"{mount} em {pct}% — {info['avail']} livres",
                    "timestamp": now,
                    "acknowledged": False,
                    "ack_by": None,
                    "ack_at": None,
                    "cleared": False,
                })

        _save(alerts)
    except Exception:
        pass


@router.get("")
async def list_alertas(historico: bool = False):
    refresh_disk_alerts()
    alerts = _load()
    if not historico:
        alerts = [a for a in alerts if not a["acknowledged"]]
    alerts_sorted = sorted(alerts, key=lambda a: a["timestamp"], reverse=True)
    return {
        "alerts": alerts_sorted,
        "unread": sum(1 for a in alerts_sorted if not a["acknowledged"]),
    }


@router.post("/{alert_id}/ack")
async def ack_alerta(alert_id: str, user: dict = Depends(get_current_user)):
    alerts = _load()
    for a in alerts:
        if a["id"] == alert_id and not a["acknowledged"]:
            a.update({
                "acknowledged": True,
                "ack_by": user["sub"],
                "ack_at": datetime.now().isoformat(timespec="seconds"),
            })
            _save(alerts)
            return {"ok": True, "unread": unread_count()}
    raise HTTPException(status_code=404, detail="Alerta não encontrado")
