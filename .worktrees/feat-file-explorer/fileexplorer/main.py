# fileexplorer/main.py
import os
import re

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator

import auth
import audit
from auth import get_current_user
from config import PORT, HOST

app = FastAPI(docs_url=None, redoc_url=None)
audit.init_db()

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


class LoginData(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) > 64 or not re.match(r'^[\w.\-@\\]+$', v):
            raise ValueError("username inválido")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 256:
            raise ValueError("password inválido")
        return v


@app.post("/api/login")
async def login(data: LoginData) -> JSONResponse:
    if not auth.pam_authenticate(data.username, data.password):
        raise HTTPException(401, "Credenciais inválidas")
    shares = auth.get_user_shares(data.username)
    if not shares:
        raise HTTPException(403, "Nenhum compartilhamento autorizado para este usuário")
    token = auth.create_token(data.username)
    resp = JSONResponse({"ok": True, "username": data.username, "shares": shares})
    resp.set_cookie("token", token, httponly=True, samesite="lax", max_age=28800)
    return resp


@app.post("/api/logout")
async def logout() -> JSONResponse:
    resp = JSONResponse({"ok": True})
    resp.delete_cookie("token")
    return resp


@app.get("/api/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    shares = auth.get_user_shares(user["sub"])
    return {"username": user["sub"], "shares": shares}


def _include_routers():
    from api import files, shares
    shares.init_db()
    app.include_router(files.router, prefix="/api/files",
                       dependencies=[Depends(get_current_user)])
    app.include_router(shares.router, prefix="/api/shares",
                       dependencies=[Depends(get_current_user)])

_include_routers()

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/login", response_class=HTMLResponse)
    async def login_page():
        with open(os.path.join(STATIC_DIR, "login.html")) as f:
            return f.read()

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def spa(full_path: str, request: Request):
        token = request.cookies.get("token")
        if not token or not auth.decode_token(token):
            return RedirectResponse("/login")
        with open(os.path.join(STATIC_DIR, "index.html")) as f:
            return HTMLResponse(f.read())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
