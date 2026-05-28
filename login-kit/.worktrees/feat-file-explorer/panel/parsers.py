# panel/parsers.py
"""
Log parsers for LABSRVFILES Admin Panel.

All functions receive text strings (callers read the files),
making them pure functions — easily testable.

Logs parsed:
  - ~/migrate-gdrive-all.log       → parse_migration_log
  - /var/log/backup-labsrv.log     → parse_backup_log
  - /var/log/samba/audit.log       → parse_audit_log
"""

import re

# ──────────────────────────────────────────────
# Full list of Team Drives being migrated
# Deve refletir exatamente o migrate-gdrive-all.sh
# ──────────────────────────────────────────────
ALL_DRIVES = [
    "AMOSTRAGEM", "ARQUIVOS_GERADORES", "ASSUNTOS_REGULATORIOS", "BOOK_DE_INDICADORES",
    "COMERCIAL", "CONTABILIDADE", "CONTROLE_files_research_PART1", "CONTROLE_files_research_PART2",
    "CONTROLE_DA_QUALIDADE", "CQ_CONSULTAS_ATE_2019", "DEPTO_PESSOAL", "DEPTO_TECNICO",
    "DIRETORIA_ADMIN_FINANCEIRA", "DIRETORIA_TECNICA", "DRE_PROJETADO", "ENDOMARKETING",
    "FARMACOPEIAS", "FARMACOVIGILANCIA", "FINANCEIRO", "GARANTIA", "IFS_HMLG", "IFS_PROD",
    "IMAGENS_CAMERAS", "INDICADORES_POWER_BI", "INDUSTRIAL", "LOGISTICA", "MALA_DIRETA_BD_IFS",
    "MANUTENCAO", "MARKETING", "METADADOS", "NOTIFIC_RJ", "PCP_COMPRAS",
    "PLANILHAS_COLABORATIVAS", "POWERBI_DADOS", "PRODUCAO",
    "RECURSOS_HUMANOS", "REGULATORIO", "RENOVACAO_LICENCA_AMBIENTAL_2026",
    "SECRETARIA_EXECUTIVA", "SEGURANCA_DO_TRABALHO", "VALIDACAO", "VENDAS",
]
# PUBLICO_GDRV removido intencionalmente: migração descartada (drive público sem valor operacional)

# ──────────────────────────────────────────────
# Regex patterns
# ──────────────────────────────────────────────
# Log format: [2026-04-10 21:04:32] >>> INICIANDO: NAME (ID: xxx)
_RE_INICIANDO  = re.compile(r"\[(.+?)\] >>> INICIANDO: (\S+)")
# Log format: [timestamp] <<< CONCLUÍDO: NAME
_RE_CONCLUIDO  = re.compile(r"\[(.+?)\] <<< CONCLU[IÍ]DO: (\S+)")
# Log format: [timestamp] <<< ERRO (código N): NAME — ...
_RE_ERRO       = re.compile(r"\[(.+?)\] <<< ERRO[^:]*: (\S+)")
_RE_TRANSFERRED = re.compile(
    r"Transferred:\s+[\d.]+\s+\w+\s*/\s*[\d.]+\s+\w+,\s*(\d+)%,\s*([\d.]+\s+\w+/s),\s*ETA\s+(\S+)"
)

_RE_DELTA_INICIANDO = re.compile(r"\[(.+?)\] >>> DELTA-SYNC: (\S+)")
_RE_DELTA_OK        = re.compile(r"\[(.+?)\] <<< DELTA-OK: (\S+)")
_RE_DELTA_ERRO      = re.compile(r"\[(.+?)\] <<< DELTA-ERRO[^:]*: (\S+)")

_RE_BKG_START       = re.compile(r"\[(.+?)\] ====== INÍCIO DO BACKUP")
_RE_BKG_END         = re.compile(r"\[(.+?)\] ====== BACKUP .* CONCLU[IÍ]DO")
_RE_BKG_OK          = re.compile(r"\[(.+?)\] <<< BACKUP-OK: (\S+)")
_RE_BKG_ERRO        = re.compile(r"\[(.+?)\] <<< BACKUP-ERRO[^:]*: (\S+)")

_RE_BAK_INICIADO  = re.compile(r"\[(.+?)\] BACKUP INICIADO")
_RE_BAK_RSYNC     = re.compile(
    r"rsync:\s+([\d.]+\s+\w+)\s+transferidos,\s+(\d+)\s+arquivos,\s+duracao\s+(\S+)"
)
_RE_BAK_CONCLUIDO = re.compile(r"\[(.+?)\] BACKUP CONCLU[IÍ]DO:\s*(OK|ERRO)", re.IGNORECASE)

def _default_drive_state(name: str) -> dict:
    return {"name": name, "status": "pending", "size": "", "percent": 0, "speed": "", "eta": "", "files_copied": 0}


_RE_AUDIT = re.compile(
    r"(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+\S+\s+smbd_audit:\s+"
    r"([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|(.+)"
)


# ──────────────────────────────────────────────
# parse_migration_log
# ──────────────────────────────────────────────

def parse_migration_log(text: str) -> dict:
    """
    Parse migrate-gdrive-all.log content.

    Returns:
        {
            "drives":     list of drive dicts,
            "current":    running drive dict or None,
            "done_count": int,
            "total":      int,
        }

    Each drive dict:
        {
            "name":    str,
            "status":  "done" | "running" | "error" | "pending",
            "size":    str,
            "percent": int,
            "speed":   str,
            "eta":     str,
        }
    """
    # Build a working dict keyed by drive name
    state: dict[str, dict] = {name: _default_drive_state(name) for name in ALL_DRIVES}

    current_running: str | None = None

    for line in text.splitlines():
        stripped = line.strip()

        # INICIANDO
        m = _RE_INICIANDO.match(stripped)
        if m:
            name = m.group(2)
            if name not in state:
                state[name] = _default_drive_state(name)
            state[name]["status"] = "running"
            current_running = name
            continue

        # CONCLUIDO / CONCLUÍDO
        m = _RE_CONCLUIDO.match(stripped)
        if m:
            name = m.group(2)
            if name not in state:
                state[name] = _default_drive_state(name)
            state[name]["status"]  = "done"
            state[name]["percent"] = 100
            if current_running == name:
                current_running = None
            continue

        # ERRO
        m = _RE_ERRO.match(stripped)
        if m:
            name = m.group(2)
            if name not in state:
                state[name] = _default_drive_state(name)
            state[name]["status"] = "error"
            if current_running == name:
                current_running = None
            continue

        # Transferred progress line
        m = _RE_TRANSFERRED.search(line)
        if m and current_running:
            state[current_running]["percent"] = int(m.group(1))
            state[current_running]["speed"]   = m.group(2)
            state[current_running]["eta"]     = m.group(3)

    # Count files copied in the current running drive session
    if current_running:
        marker = f">>> INICIANDO: {current_running}"
        last_pos = text.rfind(marker)
        if last_pos != -1:
            tail = text[last_pos:]
            state[current_running]["files_copied"] = tail.count(": Copied")

    drives = list(state.values())
    done_count  = sum(1 for d in drives if d["status"] == "done")
    error_count = sum(1 for d in drives if d["status"] == "error")
    current = state[current_running] if current_running else None

    return {
        "drives":      drives,
        "current":     current,
        "done_count":  done_count,
        "error_count": error_count,
        "total":       len(drives),
    }


# ──────────────────────────────────────────────
# parse_delta_sync_log
# ──────────────────────────────────────────────

def parse_delta_sync_log(text: str) -> dict:
    """Parse ~/delta-sync-gdrive.log. Returns same shape as parse_migration_log."""
    state: dict[str, dict] = {name: {"name": name, "status": "pending"} for name in ALL_DRIVES}
    current_running: str | None = None

    for line in text.splitlines():
        stripped = line.strip()
        m = _RE_DELTA_INICIANDO.match(stripped)
        if m:
            name = m.group(2)
            if name in state:
                state[name]["status"] = "running"
                current_running = name
            continue
        m = _RE_DELTA_OK.match(stripped)
        if m:
            name = m.group(2)
            if name in state:
                state[name]["status"] = "done"
                if current_running == name:
                    current_running = None
            continue
        m = _RE_DELTA_ERRO.match(stripped)
        if m:
            name = m.group(2)
            if name in state:
                state[name]["status"] = "error"
                if current_running == name:
                    current_running = None

    drives = list(state.values())
    return {
        "drives":      drives,
        "current":     current_running,
        "done_count":  sum(1 for d in drives if d["status"] == "done"),
        "error_count": sum(1 for d in drives if d["status"] == "error"),
        "total":       len(drives),
    }


# ──────────────────────────────────────────────
# parse_backup_gdrive_log
# ──────────────────────────────────────────────

def parse_backup_gdrive_log(text: str) -> dict:
    """Parse ~/backup-to-gdrive.log. Returns last run stats + per-drive status."""
    # Find last run boundary
    last_start_pos: int | None = None
    last_start_ts: str | None = None
    for m in _RE_BKG_START.finditer(text):
        last_start_pos = m.start()
        last_start_ts = m.group(1)

    if last_start_pos is None:
        return {
            "last_run_start": None, "last_run_end": None,
            "completed": False, "drives": [], "done_count": 0, "error_count": 0, "total": 0,
        }

    run_text = text[last_start_pos:]
    state: dict[str, dict] = {name: {"name": name, "status": "pending"} for name in ALL_DRIVES}

    for line in run_text.splitlines():
        stripped = line.strip()
        m = _RE_BKG_OK.match(stripped)
        if m:
            name = m.group(2)
            if name in state:
                state[name]["status"] = "done"
            continue
        m = _RE_BKG_ERRO.match(stripped)
        if m:
            name = m.group(2)
            if name in state:
                state[name]["status"] = "error"

    end_m = _RE_BKG_END.search(run_text)
    drives = list(state.values())
    return {
        "last_run_start": last_start_ts,
        "last_run_end":   end_m.group(1) if end_m else None,
        "completed":      end_m is not None,
        "drives":         drives,
        "done_count":     sum(1 for d in drives if d["status"] == "done"),
        "error_count":    sum(1 for d in drives if d["status"] == "error"),
        "total":          len(drives),
    }


# ──────────────────────────────────────────────
# parse_backup_log
# ──────────────────────────────────────────────

def parse_backup_log(text: str) -> list:
    """
    Parse /var/log/backup-labsrv.log content.

    Returns list of backup entries, most recent first.

    Each entry:
        {
            "start":    str,
            "end":      str,
            "status":   "ok" | "erro" | "running",
            "size":     str,
            "duration": str,
            "files":    str,
        }
    """
    entries: list[dict] = []
    current: dict | None = None

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        m = _RE_BAK_INICIADO.match(line)
        if m:
            # Push any unfinished entry
            if current is not None:
                entries.append(current)
            current = {
                "start":    m.group(1),
                "end":      "",
                "status":   "running",
                "size":     "",
                "duration": "",
                "files":    "",
            }
            continue

        m = _RE_BAK_RSYNC.search(line)
        if m and current is not None:
            current["size"]     = m.group(1)
            current["files"]    = m.group(2)
            current["duration"] = m.group(3)
            continue

        m = _RE_BAK_CONCLUIDO.match(line)
        if m and current is not None:
            current["end"]    = m.group(1)
            current["status"] = m.group(2).lower()   # "ok" or "erro"
            entries.append(current)
            current = None

    # Trailing running entry (log cut off mid-backup)
    if current is not None:
        entries.append(current)

    # Most recent first
    entries.reverse()
    return entries


# ──────────────────────────────────────────────
# parse_audit_log
# ──────────────────────────────────────────────

def parse_audit_log(text: str) -> list:
    """
    Parse /var/log/samba/audit.log (syslog + smbd_audit VFS module).

    Returns list of entries in parse order.

    Each entry:
        {
            "timestamp": str,
            "user":      str,
            "ip":        str,
            "share":     str,
            "op":        str,   # uppercased
            "file":      str,
            "status":    "ok" | "denied",
        }
    """
    entries: list[dict] = []

    for line in text.splitlines():
        m = _RE_AUDIT.search(line)
        if not m:
            continue
        raw_status = m.group(7).strip()
        status = "denied" if "DENIED" in raw_status.upper() else "ok"
        entries.append({
            "timestamp": m.group(1),
            "user":      m.group(2).strip(),
            "ip":        m.group(3).strip(),
            "share":     m.group(4).strip(),
            "op":        m.group(5).strip().upper(),
            "file":      m.group(6).strip(),
            "status":    status,
        })

    return entries
