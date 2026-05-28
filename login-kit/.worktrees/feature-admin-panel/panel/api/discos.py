# panel/api/discos.py
import json
from fastapi import APIRouter
from auth import run_cmd
from config import DISK_MOUNTS

router = APIRouter()


@router.get("")
async def discos():
    out, _ = run_cmd(["df", "--output=source,target,size,used,avail,pcent", "-h"] + DISK_MOUNTS)
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
    lsblk_out, _ = run_cmd(["lsblk", "-J", "-o", "NAME,SIZE,TYPE,MOUNTPOINT"])
    try:
        lsblk = json.loads(lsblk_out)
    except Exception:
        lsblk = {}
    return {"disks": disks, "lsblk": lsblk}
