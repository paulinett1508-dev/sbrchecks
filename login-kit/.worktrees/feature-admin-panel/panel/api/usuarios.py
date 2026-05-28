# panel/api/usuarios.py
from fastapi import APIRouter
from auth import run_cmd

router = APIRouter()


@router.get("")
async def usuarios():
    out, _ = run_cmd(["getent", "passwd"])
    users = []
    for line in out.splitlines():
        parts = line.split(":")
        if len(parts) < 7:
            continue
        uid = int(parts[2]) if parts[2].isdigit() else 0
        if uid < 1000:
            continue
        username = parts[0]
        fullname = parts[4].split(",")[0]
        groups_out, _ = run_cmd(["id", "-Gn", username])
        last_out, _ = run_cmd(["last", "-n", "1", "-w", username])
        last_line = last_out.splitlines()[0] if last_out else ""
        users.append({
            "username": username,
            "fullname": fullname,
            "shell": parts[6],
            "groups": groups_out.split() if groups_out else [],
            "last_login": last_line,
        })
    return {"users": users, "total": len(users)}
