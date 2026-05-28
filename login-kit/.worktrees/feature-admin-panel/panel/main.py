# panel/main.py
import os

from fastapi import FastAPI, Request, Response, Depends
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import auth
from auth import get_current_user, require_role, log_admin_action
from config import PORT, HOST

app = FastAPI(docs_url=None, redoc_url=None)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


# ---------------------------------------------------------------------------
# Login / logout / me
# ---------------------------------------------------------------------------

class LoginData(BaseModel):
    username: str
    password: str


@app.post("/api/login")
async def login(data: LoginData) -> JSONResponse:
    if not auth.pam_authenticate(data.username, data.password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if not auth.check_admin_group(data.username):
        raise HTTPException(status_code=403, detail="Usuário não pertence ao grupo de administradores")
    role = auth.get_user_role(data.username)
    token = auth.create_token(data.username, role)
    resp = JSONResponse({"ok": True, "role": role, "username": data.username})
    resp.set_cookie("token", token, httponly=True, samesite="lax", max_age=28800)
    return resp


@app.post("/api/logout")
async def logout() -> JSONResponse:
    resp = JSONResponse({"ok": True})
    resp.delete_cookie("token")
    return resp


@app.get("/api/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    return user


# ---------------------------------------------------------------------------
# Sub-routers (imported lazily to avoid circular imports)
# ---------------------------------------------------------------------------

def _include_routers() -> None:
    import api.dashboard as dashboard
    import api.discos as discos
    import api.shares as shares
    import api.servicos as servicos
    import api.conexoes as conexoes
    import api.usuarios as usuarios
    import api.migracao as migracao
    import api.backup as backup
    import api.logs_samba as logs_samba
    import api.admin as admin_api
    import api.terminal as terminal

    app.include_router(dashboard.router, prefix="/api/dashboard",
                       dependencies=[Depends(get_current_user)])
    app.include_router(discos.router, prefix="/api/discos",
                       dependencies=[Depends(get_current_user)])
    app.include_router(shares.router, prefix="/api/shares",
                       dependencies=[Depends(get_current_user)])
    app.include_router(servicos.router, prefix="/api/servicos",
                       dependencies=[Depends(get_current_user)])
    app.include_router(conexoes.router, prefix="/api/conexoes",
                       dependencies=[Depends(get_current_user)])
    app.include_router(usuarios.router, prefix="/api/usuarios",
                       dependencies=[Depends(get_current_user)])
    app.include_router(migracao.router, prefix="/api/migracao",
                       dependencies=[Depends(get_current_user)])
    app.include_router(backup.router, prefix="/api/backup",
                       dependencies=[Depends(get_current_user)])
    app.include_router(logs_samba.router, prefix="/api/logs",
                       dependencies=[Depends(get_current_user)])
    app.include_router(admin_api.router, prefix="/api/admin",
                       dependencies=[Depends(get_current_user)])
    app.include_router(terminal.router, prefix="/ws")


_include_routers()

# ---------------------------------------------------------------------------
# Static files + SPA
# ---------------------------------------------------------------------------

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/login", response_class=HTMLResponse)
async def login_page() -> str:
    with open(os.path.join(STATIC_DIR, "login.html")) as f:
        return f.read()


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def spa(full_path: str, request: Request) -> Response:
    token = request.cookies.get("token")
    if not token or not auth.decode_token(token):
        return RedirectResponse("/login")
    with open(os.path.join(STATIC_DIR, "index.html")) as f:
        return HTMLResponse(f.read())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
