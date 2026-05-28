# fileexplorer/api/files.py
import os
import shutil
import stat as stat_mod
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from auth import get_current_user
import audit

router = APIRouter()


def _get_user_shares(request: Request) -> list[dict]:
    from auth import get_user_shares
    user = get_current_user(request)
    return get_user_shares(user["sub"])


def _resolve_path(path: str, shares: list[dict]) -> tuple[Path, dict]:
    """Resolve user path to absolute Path within an authorized share. Raises 403 on violation."""
    parts = Path(path).parts
    if not parts:
        raise HTTPException(400, "Path vazio")
    share_name = parts[0]
    share = next((s for s in shares if s["name"] == share_name), None)
    if not share:
        raise HTTPException(403, "Share não autorizado")
    share_root = Path(share["root"]).resolve()
    relative = Path(*parts[1:]) if len(parts) > 1 else Path(".")
    target = (share_root / relative).resolve()
    if not str(target).startswith(str(share_root) + os.sep) and target != share_root:
        raise HTTPException(403, "Acesso negado")
    if target.is_symlink():
        raise HTTPException(403, "Acesso negado")
    return target, share


@router.get("")
async def list_dir(path: str, request: Request):
    shares = _get_user_shares(request)
    target, _ = _resolve_path(path, shares)
    if not target.exists():
        raise HTTPException(404, "Caminho não encontrado")
    if not target.is_dir():
        raise HTTPException(400, "Não é um diretório")
    items = []
    for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
        try:
            st = entry.stat(follow_symlinks=False)
            is_dir = stat_mod.S_ISDIR(st.st_mode)
            items.append({
                "name": entry.name,
                "type": "dir" if is_dir else "file",
                "size": None if is_dir else st.st_size,
                "modified": datetime.utcfromtimestamp(st.st_mtime).isoformat(),
            })
        except (PermissionError, OSError):
            continue
    return {"path": path, "items": items}


@router.get("/download")
async def download_file(path: str, request: Request):
    shares = _get_user_shares(request)
    target, _ = _resolve_path(path, shares)
    if not target.exists() or not target.is_file():
        raise HTTPException(404, "Arquivo não encontrado")
    user = get_current_user(request)
    ip = request.client.host if request.client else "unknown"
    audit.log_action(user["sub"], "download", str(target), ip)

    def _iter():
        with open(target, "rb") as f:
            while chunk := f.read(65536):
                yield chunk

    return StreamingResponse(
        _iter(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{target.name}"'},
    )


@router.post("/upload")
async def upload_file(path: str, request: Request, file: UploadFile = File(...)):
    from config import MAX_UPLOAD_BYTES
    shares = _get_user_shares(request)
    target_dir, _ = _resolve_path(path, shares)
    if not target_dir.is_dir():
        raise HTTPException(400, "Destino não é um diretório")
    dest = target_dir / Path(file.filename).name
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    size_exceeded = False
    try:
        with tmp.open("wb") as f:
            total = 0
            while True:
                chunk = await file.read(65536)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_UPLOAD_BYTES:
                    size_exceeded = True
                    break
                f.write(chunk)
        if size_exceeded:
            tmp.unlink(missing_ok=True)
            raise HTTPException(413, "Arquivo excede limite")
        tmp.rename(dest)
    except HTTPException:
        raise
    except Exception:
        tmp.unlink(missing_ok=True)
        raise
    user = get_current_user(request)
    ip = request.client.host if request.client else "unknown"
    audit.log_action(user["sub"], "upload", str(dest), ip)
    return {"ok": True, "name": Path(file.filename).name, "size": total}


class MkdirRequest(BaseModel):
    path: str


@router.post("/mkdir")
async def mkdir(req: MkdirRequest, request: Request):
    shares = _get_user_shares(request)
    target, _ = _resolve_path(req.path, shares)
    target.mkdir(parents=False, exist_ok=False)
    user = get_current_user(request)
    ip = request.client.host if request.client else "unknown"
    audit.log_action(user["sub"], "mkdir", str(target), ip)
    return {"ok": True}


class RenameRequest(BaseModel):
    path: str
    new_name: str


@router.post("/rename")
async def rename(req: RenameRequest, request: Request):
    if "/" in req.new_name or "\\" in req.new_name:
        raise HTTPException(400, "new_name não pode conter separadores de caminho")
    shares = _get_user_shares(request)
    target, _ = _resolve_path(req.path, shares)
    if not target.exists():
        raise HTTPException(404, "Caminho não encontrado")
    dest = target.parent / req.new_name
    _resolve_path(str(Path(req.path).parent / req.new_name), shares)
    target.rename(dest)
    user = get_current_user(request)
    ip = request.client.host if request.client else "unknown"
    audit.log_action(user["sub"], "rename", f"{target} -> {dest}", ip)
    return {"ok": True}


class MoveRequest(BaseModel):
    sources: list[str]
    dest: str


@router.post("/move")
async def move_files(req: MoveRequest, request: Request):
    shares = _get_user_shares(request)
    dest_dir, _ = _resolve_path(req.dest, shares)
    if not dest_dir.is_dir():
        raise HTTPException(400, "Destino não é um diretório")
    moved = []
    for src_path in req.sources:
        src, _ = _resolve_path(src_path, shares)
        if not src.exists():
            continue
        dest = _unique_dest(dest_dir, src.name, src.is_dir())
        shutil.move(str(src), str(dest))
        moved.append(src.name)
    user = get_current_user(request)
    ip = request.client.host if request.client else "unknown"
    audit.log_action(user["sub"], "move", f"{req.sources} -> {req.dest}", ip)
    return {"ok": True, "moved": moved}


class CopyRequest(BaseModel):
    sources: list[str]
    dest: str


@router.post("/copy")
async def copy_files(req: CopyRequest, request: Request):
    shares = _get_user_shares(request)
    dest_dir, _ = _resolve_path(req.dest, shares)
    if not dest_dir.is_dir():
        raise HTTPException(400, "Destino não é um diretório")
    copied = []
    for src_path in req.sources:
        src, _ = _resolve_path(src_path, shares)
        if not src.exists() or src.is_symlink():
            continue
        is_dir = src.is_dir()
        dest = _unique_dest(dest_dir, src.name, is_dir)
        if is_dir:
            shutil.copytree(src, dest)
        else:
            shutil.copy2(src, dest)
        copied.append(src.name)
    user = get_current_user(request)
    ip = request.client.host if request.client else "unknown"
    audit.log_action(user["sub"], "copy", f"{req.sources} -> {req.dest}", ip)
    return {"ok": True, "copied": copied}


def _unique_dest(dest_dir: Path, name: str, is_dir: bool) -> Path:
    dest = dest_dir / name
    if not dest.exists():
        return dest
    if is_dir:
        i = 1
        while (dest_dir / f"{name} (cópia {i})").exists():
            i += 1
        return dest_dir / f"{name} (cópia {i})"
    stem = Path(name).stem
    suffix = Path(name).suffix
    i = 1
    while (dest_dir / f"{stem} (cópia {i}){suffix}").exists():
        i += 1
    return dest_dir / f"{stem} (cópia {i}){suffix}"


@router.delete("")
async def delete(path: str, request: Request, confirm: bool = False):
    shares = _get_user_shares(request)
    target, _ = _resolve_path(path, shares)
    if not target.exists():
        raise HTTPException(404, "Caminho não encontrado")
    if target.is_symlink():
        raise HTTPException(403, "Acesso negado")
    if target.is_dir() and any(target.iterdir()) and not confirm:
        raise HTTPException(400, "Pasta não está vazia. Use confirm=true para confirmar.")
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    user = get_current_user(request)
    ip = request.client.host if request.client else "unknown"
    audit.log_action(user["sub"], "delete", str(target), ip)
    return {"ok": True}
