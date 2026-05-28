# panel/api/terminal.py
import asyncio
import os
import select
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from auth import decode_token, log_admin_action

router = APIRouter()

INACTIVITY_TIMEOUT = 10 * 60  # encerra sessão após 10 min sem I/O


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
        # Limpa variáveis de ambiente sensíveis antes de spawnar o shell
        for var in ("JWT_SECRET", "SECRET_KEY", "DB_PASSWORD"):
            os.environ.pop(var, None)
        os.execlp("bash", "bash")
        return  # unreachable

    last_activity = time.monotonic()

    async def read_pty():
        nonlocal last_activity
        while True:
            await asyncio.sleep(0.02)
            r, _, _ = select.select([fd], [], [], 0)
            if r:
                try:
                    data = os.read(fd, 1024)
                    last_activity = time.monotonic()
                    await websocket.send_bytes(data)
                except OSError:
                    break

    async def inactivity_watchdog():
        while True:
            await asyncio.sleep(30)
            if time.monotonic() - last_activity > INACTIVITY_TIMEOUT:
                try:
                    await websocket.send_bytes(
                        "\r\n\x1b[33m[Sessao encerrada por inatividade (10 min)]\x1b[0m\r\n".encode()
                    )
                    await websocket.close()
                except Exception:
                    pass
                log_admin_action(username, "TERMINAL SESSION CLOSED (inatividade)")
                break

    read_task = asyncio.create_task(read_pty())
    watchdog_task = asyncio.create_task(inactivity_watchdog())
    try:
        while True:
            data = await websocket.receive_bytes()
            if data:
                last_activity = time.monotonic()
                os.write(fd, data)
    except (WebSocketDisconnect, OSError):
        pass
    finally:
        read_task.cancel()
        watchdog_task.cancel()
        try:
            os.kill(pid, 9)
            os.waitpid(pid, 0)
        except OSError:
            pass
        log_admin_action(username, "TERMINAL SESSION CLOSED")
