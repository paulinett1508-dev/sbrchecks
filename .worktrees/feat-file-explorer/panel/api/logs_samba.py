# panel/api/logs_samba.py
import csv
import html
import io
import os
from fastapi import APIRouter, Query
from fastapi.responses import Response
from config import SAMBA_AUDIT_LOG
from parsers import parse_audit_log

router = APIRouter()


@router.get("")
async def logs(
    username: str = Query(""),
    share: str = Query(""),
    op: str = Query(""),
    page: int = Query(1),
):
    text = ""
    if os.path.exists(SAMBA_AUDIT_LOG):
        with open(SAMBA_AUDIT_LOG, "r", errors="replace") as f:
            text = f.read()
    entries = parse_audit_log(text)
    if username:
        entries = [e for e in entries if username.lower() in e["user"].lower()]
    if share:
        entries = [e for e in entries if share.upper() in e["share"].upper()]
    if op:
        entries = [e for e in entries if op.upper() == e["op"]]
    entries.reverse()
    per_page = 100
    total = len(entries)
    start = (page - 1) * per_page
    return {
        "entries": entries[start: start + per_page],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/audit/{username}")
async def audit_user(username: str):
    text = ""
    if os.path.exists(SAMBA_AUDIT_LOG):
        with open(SAMBA_AUDIT_LOG, "r", errors="replace") as f:
            text = f.read()
    all_entries = parse_audit_log(text)
    entries = [e for e in all_entries if e["user"] == username]
    entries.reverse()
    timeline = entries[:50]
    stats = {
        "acessos": sum(1 for e in entries if e["op"] in ("OPEN", "READ", "OPENDIR")),
        "modificacoes": sum(1 for e in entries if e["op"] in ("WRITE", "CREATE", "RENAME")),
        "uploads": sum(1 for e in entries if e["op"] == "CREATE"),
        "negados": sum(1 for e in entries if e["status"] == "denied"),
    }
    return {"username": username, "stats": stats, "timeline": timeline}


@router.get("/export/{username}")
async def export_audit(username: str, format: str = "csv"):
    text = ""
    if os.path.exists(SAMBA_AUDIT_LOG):
        with open(SAMBA_AUDIT_LOG, "r", errors="replace") as f:
            text = f.read()
    entries = [e for e in parse_audit_log(text) if e["user"] == username]
    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=["timestamp", "user", "ip", "share", "op", "file", "status"],
        )
        writer.writeheader()
        writer.writerows(entries)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=audit_{username}.csv"},
        )
    # HTML fallback
    h = html.escape
    rows = "".join(
        f"<tr><td>{h(e['timestamp'])}</td><td>{h(e['op'])}</td>"
        f"<td>{h(e['share'])}/{h(e['file'])}</td><td>{h(e['status'])}</td></tr>"
        for e in entries
    )
    html_body = (
        f"<html><body><h2>Auditoria: {h(username)}</h2>"
        f"<table border='1'><tr><th>Timestamp</th><th>Op</th>"
        f"<th>Arquivo</th><th>Status</th></tr>{rows}</table></body></html>"
    )
    return Response(
        content=html_body,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename=audit_{username}.html"},
    )
