# fileexplorer/tests/test_files_api.py
import sys, os, pathlib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

os.environ.setdefault("FILES_JWT_SECRET", "test-secret-key-32-chars-xxxxxxxxx")

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


@pytest.fixture
def share_root(tmp_path):
    root = tmp_path / "FINANCEIRO"
    root.mkdir()
    (root / "relatorio.xlsx").write_bytes(b"xlsx content")
    (root / "subpasta").mkdir()
    return root


@pytest.fixture
def client(share_root, tmp_path):
    os.environ["AUDIT_DB"] = str(tmp_path / "audit.db")
    import config
    config.AUDIT_DB = str(tmp_path / "audit.db")
    import audit
    audit.init_db()

    from main import app
    import auth as auth_mod
    token = auth_mod.create_token("joao.silva")
    shares = [{"name": "FINANCEIRO", "root": str(share_root)}]

    tc = TestClient(app, raise_server_exceptions=True)
    tc.cookies.set("token", token)
    return tc, shares


def test_list_root(client):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.get("/api/files?path=FINANCEIRO/")
    assert resp.status_code == 200
    names = [i["name"] for i in resp.json()["items"]]
    assert "relatorio.xlsx" in names
    assert "subpasta" in names


def test_list_path_traversal_blocked(client):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.get("/api/files?path=FINANCEIRO/../../etc/passwd")
    assert resp.status_code == 403


def test_download_file(client):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.get("/api/files/download?path=FINANCEIRO/relatorio.xlsx")
    assert resp.status_code == 200
    assert resp.content == b"xlsx content"


def test_download_traversal_blocked(client):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.get("/api/files/download?path=FINANCEIRO/../../../etc/passwd")
    assert resp.status_code == 403


def test_mkdir(client, share_root):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.post("/api/files/mkdir", json={"path": "FINANCEIRO/nova_pasta"})
    assert resp.status_code == 200
    assert (share_root / "nova_pasta").is_dir()


def test_rename(client, share_root):
    tc, shares = client
    (share_root / "antigo.txt").write_text("x")
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.post("/api/files/rename", json={
            "path": "FINANCEIRO/antigo.txt",
            "new_name": "novo.txt"
        })
    assert resp.status_code == 200
    assert (share_root / "novo.txt").exists()
    assert not (share_root / "antigo.txt").exists()


def test_delete_file(client, share_root):
    tc, shares = client
    (share_root / "lixo.txt").write_text("x")
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.delete("/api/files?path=FINANCEIRO/lixo.txt")
    assert resp.status_code == 200
    assert not (share_root / "lixo.txt").exists()


def test_delete_nonempty_dir_requires_confirm(client, share_root):
    tc, shares = client
    d = share_root / "cheio"
    d.mkdir()
    (d / "arquivo.txt").write_text("x")
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.delete("/api/files?path=FINANCEIRO/cheio")
    assert resp.status_code == 400

    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.delete("/api/files?path=FINANCEIRO/cheio&confirm=true")
    assert resp.status_code == 200


def test_upload_size_limit(client, share_root):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        with patch("config.MAX_UPLOAD_BYTES", 10):
            resp = tc.post(
                "/api/files/upload?path=FINANCEIRO/",
                files={"file": ("big.txt", b"x" * 20, "text/plain")},
            )
    assert resp.status_code == 413


def test_unauthenticated_returns_401():
    import config as cfg
    import audit as aud
    from main import app
    from fastapi.testclient import TestClient
    tc = TestClient(app, raise_server_exceptions=False)
    resp = tc.get("/api/files?path=FINANCEIRO/")
    assert resp.status_code == 401
