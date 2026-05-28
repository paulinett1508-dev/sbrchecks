# panel/api/shares.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from shared.share_groups import SHARE_GROUPS
from fastapi import APIRouter
from auth import run_cmd

router = APIRouter()

@router.get("")
async def shares():
    smb_out, _ = run_cmd(["smbstatus", "-S"])
    active_shares = set()
    for line in smb_out.splitlines():
        parts = line.split()
        if parts:
            active_shares.add(parts[0])
    result = [
        {"name": name, "group": group, "active_connections": name in active_shares}
        for name, group in SHARE_GROUPS.items()
    ]
    return {"shares": result, "total": len(result)}
