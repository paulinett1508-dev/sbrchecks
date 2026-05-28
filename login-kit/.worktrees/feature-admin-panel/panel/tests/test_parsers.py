# panel/tests/test_parsers.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from parsers import parse_migration_log, parse_backup_log, parse_audit_log

MIG_SAMPLE = """
[2026-04-10 14:23:01] >>> INICIANDO: AMOSTRAGEM
[2026-04-10 14:23:45] <<< CONCLUÍDO: AMOSTRAGEM
[2026-04-10 14:24:00] >>> INICIANDO: CONTABILIDADE
[2026-04-10 16:10:00] <<< CONCLUÍDO: CONTABILIDADE
[2026-04-11 09:00:00] >>> INICIANDO: CONTROLE_files_research_PART1
Transferred: 118 GiB / 320 GiB, 37%, 45 MiB/s, ETA 1h30m
"""

BAK_SAMPLE = """
[2026-04-12 02:14:01] BACKUP INICIADO
rsync: 4.2 GB transferidos, 1523 arquivos, duracao 8m32s
[2026-04-12 02:22:33] BACKUP CONCLUIDO: OK
"""

AUDIT_SAMPLE = """Apr 12 10:23:01 LABSRVFILES smbd_audit: joao.silva|192.86.221.45|FINANCEIRO|open|relatorio.xlsx|ok
Apr 12 10:23:05 LABSRVFILES smbd_audit: joao.silva|192.86.221.45|FINANCEIRO|create|novo.xlsx|ok
Apr 12 10:24:00 LABSRVFILES smbd_audit: carlos.mendes|192.86.221.102|CONTROLADORIA|open|planilha.xlsx|NT_STATUS_ACCESS_DENIED
"""

def test_migration_done_drives():
    r = parse_migration_log(MIG_SAMPLE)
    done = [d for d in r["drives"] if d["status"] == "done"]
    names = [d["name"] for d in done]
    assert "AMOSTRAGEM" in names
    assert "CONTABILIDADE" in names

def test_migration_running_drive():
    r = parse_migration_log(MIG_SAMPLE)
    running = [d for d in r["drives"] if d["status"] == "running"]
    assert len(running) == 1
    assert running[0]["name"] == "CONTROLE_files_research_PART1"
    assert running[0]["percent"] == 37

def test_migration_done_count():
    r = parse_migration_log(MIG_SAMPLE)
    assert r["done_count"] == 2

def test_migration_current_drive():
    r = parse_migration_log(MIG_SAMPLE)
    assert r["current"] is not None
    assert r["current"]["name"] == "CONTROLE_files_research_PART1"

def test_migration_empty_log():
    r = parse_migration_log("")
    assert r["done_count"] == 0
    assert r["current"] is None

def test_backup_parse_ok():
    r = parse_backup_log(BAK_SAMPLE)
    assert len(r) == 1
    assert r[0]["status"] == "ok"
    assert "4.2 GB" in r[0]["size"]

def test_backup_empty_log():
    r = parse_backup_log("")
    assert r == []

def test_backup_parse_concluido_with_accent():
    """parse_backup_log handles CONCLUÍDO with accent (Portuguese)."""
    log = """[2026-04-12 02:14:01] BACKUP INICIADO
rsync: 3.1 GB transferidos, 800 arquivos, duracao 5m00s
[2026-04-12 02:19:01] BACKUP CONCLUÍDO: OK
"""
    r = parse_backup_log(log)
    assert len(r) == 1
    assert r[0]["status"] == "ok"

def test_audit_entries_count():
    r = parse_audit_log(AUDIT_SAMPLE)
    assert len(r) == 3

def test_audit_denied_entry():
    r = parse_audit_log(AUDIT_SAMPLE)
    denied = [e for e in r if e["status"] == "denied"]
    assert len(denied) == 1
    assert denied[0]["user"] == "carlos.mendes"
    assert denied[0]["share"] == "CONTROLADORIA"

def test_audit_ok_entry():
    r = parse_audit_log(AUDIT_SAMPLE)
    ok_entries = [e for e in r if e["status"] == "ok"]
    assert len(ok_entries) == 2
    assert ok_entries[0]["file"] == "relatorio.xlsx"

def test_audit_empty_log():
    r = parse_audit_log("")
    assert r == []
