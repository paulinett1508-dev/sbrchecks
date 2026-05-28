# fileexplorer/audit.py
import sqlite3
from datetime import datetime, timezone


def _conn() -> sqlite3.Connection:
    from config import AUDIT_DB
    return sqlite3.connect(AUDIT_DB)


def init_db() -> None:
    with _conn() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS file_audit_log (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                username  TEXT NOT NULL,
                action    TEXT NOT NULL,
                path      TEXT NOT NULL,
                ip        TEXT NOT NULL
            )
        """)
        db.execute("PRAGMA journal_mode=WAL")
        db.commit()


def log_action(username: str, action: str, path: str, ip: str) -> None:
    with _conn() as db:
        db.execute(
            "INSERT INTO file_audit_log (timestamp, username, action, path, ip) VALUES (?,?,?,?,?)",
            (datetime.now(timezone.utc).isoformat(), username, action, path, ip)
        )


def query_logs(
    user: str | None = None,
    action: str | None = None,
    from_ts: str | None = None,
    to_ts: str | None = None,
    limit: int = 100,
) -> list[dict]:
    sql = "SELECT id, timestamp, username, action, path, ip FROM file_audit_log WHERE 1=1"
    params: list = []
    if user:
        sql += " AND username = ?"
        params.append(user)
    if action:
        sql += " AND action = ?"
        params.append(action)
    if from_ts:
        sql += " AND timestamp >= ?"
        params.append(from_ts)
    if to_ts:
        sql += " AND timestamp <= ?"
        params.append(to_ts)
    sql += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    with _conn() as db:
        db.row_factory = sqlite3.Row
        rows = db.execute(sql, params).fetchall()
    return [dict(r) for r in rows]
