# fileexplorer/api/shares.py
import json
import os
import sqlite3
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from auth import get_current_user
import audit

router = APIRouter()


def _db():
    from config import SHARES_DB
    return SHARES_DB


def init_db():
    with sqlite3.connect(_db()) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS virtual_shares (
                id       TEXT PRIMARY KEY,
                name     TEXT NOT NULL,
                source_path TEXT NOT NULL,
                source_root TEXT NOT NULL,
                owner    TEXT NOT NULL,
                recipients TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)


def get_received_shares(username: str) -> list[dict]:
    """Returns virtual share entries for shares the user received."""
    try:
        db_path = _db()
        if not os.path.exists(db_path):
            return []
        with sqlite3.connect(db_path) as db:
            db.row_factory = sqlite3.Row
            rows = db.execute(
                "SELECT * FROM virtual_shares WHERE recipients LIKE ?",
                (f'%"{username}"%',)
            ).fetchall()
        result = []
        for r in rows:
            result.append({
                "name": f"⇄ {r['name']}",
                "root": r["source_root"],
                "virtual": True,
                "share_id": r["id"],
                "owner": r["owner"],
            })
        return result
    except Exception:
        return []


class ShareCreate(BaseModel):
    source_path: str
    name: str
    recipients: list[str]


@router.post("")
async def create_share(req: ShareCreate, request: Request):
    from api.files import _get_user_shares, _resolve_path
    user = get_current_user(request)
    shares = _get_user_shares(request)
    target, share = _resolve_path(req.source_path, shares)
    if not target.is_dir():
        raise HTTPException(400, "Só é possível compartilhar pastas")
    if not req.recipients:
        raise HTTPException(400, "Informe pelo menos um destinatário")
    recipients = [r.strip().lower() for r in req.recipients if r.strip()]
    share_id = str(uuid.uuid4())[:8]
    with sqlite3.connect(_db()) as db:
        db.execute(
            "INSERT INTO virtual_shares VALUES (?,?,?,?,?,?,?)",
            (share_id, req.name, req.source_path, str(target),
             user["sub"], json.dumps(recipients), datetime.utcnow().isoformat())
        )
    audit.log_action(user["sub"], "share", f"{req.source_path} -> {recipients}", "internal")
    return {"ok": True, "id": share_id}


@router.get("")
async def list_shares(request: Request):
    user = get_current_user(request)
    with sqlite3.connect(_db()) as db:
        db.row_factory = sqlite3.Row
        owned = db.execute(
            "SELECT * FROM virtual_shares WHERE owner=? ORDER BY created_at DESC",
            (user["sub"],)
        ).fetchall()
        received = db.execute(
            "SELECT * FROM virtual_shares WHERE recipients LIKE ? ORDER BY created_at DESC",
            (f'%"{user["sub"]}"%',)
        ).fetchall()
    def _fmt(rows):
        result = []
        for r in rows:
            d = dict(r)
            d["recipients"] = json.loads(d["recipients"])
            result.append(d)
        return result
    return {"owned": _fmt(owned), "received": _fmt(received)}


@router.delete("/{share_id}")
async def delete_share(share_id: str, request: Request):
    user = get_current_user(request)
    with sqlite3.connect(_db()) as db:
        cur = db.execute(
            "DELETE FROM virtual_shares WHERE id=? AND owner=?",
            (share_id, user["sub"])
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Share não encontrado ou sem permissão")
    return {"ok": True}
