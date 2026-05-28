# fileexplorer/tests/test_audit.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("FILES_JWT_SECRET", "test-secret-key-32-chars-xxxxxxxxx")

import pytest


@pytest.fixture
def tmp_db(tmp_path):
    db = str(tmp_path / "audit.db")
    os.environ["AUDIT_DB"] = db
    import config
    config.AUDIT_DB = db
    import audit
    audit.init_db()
    yield db


def test_log_and_query(tmp_db):
    from audit import log_action, query_logs
    log_action("joao.silva", "upload", "/srv/samba/FINANCEIRO/file.xlsx", "10.0.0.5")
    rows = query_logs()
    assert len(rows) == 1
    assert rows[0]["username"] == "joao.silva"
    assert rows[0]["action"] == "upload"
    assert rows[0]["path"] == "/srv/samba/FINANCEIRO/file.xlsx"


def test_query_filter_by_user(tmp_db):
    from audit import log_action, query_logs
    log_action("user1", "download", "/srv/samba/FINANCEIRO/a.pdf", "10.0.0.1")
    log_action("user2", "delete",   "/srv/samba/FINANCEIRO/b.pdf", "10.0.0.2")
    rows = query_logs(user="user1")
    assert len(rows) == 1
    assert rows[0]["username"] == "user1"


def test_query_filter_by_action(tmp_db):
    from audit import log_action, query_logs
    log_action("u", "upload",   "/p1", "1.1.1.1")
    log_action("u", "delete",   "/p2", "1.1.1.1")
    log_action("u", "download", "/p3", "1.1.1.1")
    rows = query_logs(action="delete")
    assert len(rows) == 1
    assert rows[0]["action"] == "delete"


def test_query_limit(tmp_db):
    from audit import log_action, query_logs
    for i in range(10):
        log_action("u", "upload", f"/p{i}", "1.1.1.1")
    rows = query_logs(limit=3)
    assert len(rows) == 3
