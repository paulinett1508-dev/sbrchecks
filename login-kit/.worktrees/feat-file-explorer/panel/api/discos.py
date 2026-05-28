# panel/api/discos.py
import json
from fastapi import APIRouter
from auth import run_cmd

router = APIRouter()

# Pontos de montagem que não interessam para o painel (boot, swap, etc.)
_EXCLUDE_MOUNTS = {"/boot", "/boot/efi"}


def _real_mounts() -> list[str]:
    """Detecta dinamicamente todos os pontos de montagem de dispositivos reais.

    Usa findmnt --real que exclui pseudo-filesystems (tmpfs, sysfs, proc,
    cgroup, devtmpfs). Loop devices (snaps) também são filtrados.
    """
    out, _ = run_cmd(["findmnt", "-ln", "--real", "-o", "SOURCE,TARGET"])
    mounts = []
    for line in out.splitlines():
        parts = line.split(None, 1)
        if len(parts) == 2:
            source, target = parts[0].strip(), parts[1].strip()
            if source.startswith("/dev/loop"):
                continue
            if target in _EXCLUDE_MOUNTS:
                continue
            mounts.append(target)
    return mounts


@router.get("")
async def discos():
    mounts = _real_mounts()
    disks = []
    if mounts:
        out, _ = run_cmd(["df", "--output=source,target,size,used,avail,pcent", "-h"] + mounts)
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
