# panel/api/terminal.py
import asyncio
import os
import select
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from auth import decode_token, log_admin_action

router = APIRouter()


@router.websocket("/terminal")
async def terminal_ws(websocket: WebSocket):
    # Validate JWT from cookie — only superadmin allowed
    token = websocket.cookies.get("token", "")
    payload = decode_token(token)
    if not payload or payload.get("role") != "superadmin":
        await websocket.close(code=4003)
        return

    username = payload["sub"]
    await websocket.accept()
    log_admin_action(username, "TERMINAL SESSION OPENED")

    try:
        import pty
    except ImportError:
        # pty not available on Windows dev environment
        await websocket.send_bytes(b"[pty not available on this platform]\r\n")
        await websocket.close()
        log_admin_action(username, "TERMINAL SESSION CLOSED (pty unavailable)")
        return

    pid, fd = pty.fork()
    if pid == 0:
        os.execlp("bash", "bash")
        return  # unreachable

    async def read_pty():
        while True:
            await asyncio.sleep(0.02)
            r, _, _ = select.select([fd], [], [], 0)
            if r:
                try:
                    data = os.read(fd, 1024)
                    await websocket.send_bytes(data)
                except OSError:
                    break

    read_task = asyncio.create_task(read_pty())
    try:
        while True:
            data = await websocket.receive_bytes()
            if data:
                os.write(fd, data)
    except (WebSocketDisconnect, OSError):
        pass
    finally:
        read_task.cancel()
        try:
            os.kill(pid, 9)
            os.waitpid(pid, 0)
        except OSError:
            pass
        log_admin_action(username, "TERMINAL SESSION CLOSED")
