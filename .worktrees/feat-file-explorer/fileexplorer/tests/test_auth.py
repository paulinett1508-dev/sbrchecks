# fileexplorer/tests/test_auth.py
import sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from unittest.mock import patch
import pytest

os.environ.setdefault("FILES_JWT_SECRET", "test-secret-key-32-chars-xxxxxxxxx")
os.environ.setdefault("AUDIT_DB", "/tmp/test_audit.db")


def test_create_and_decode_token():
    from auth import create_token, decode_token
    token = create_token("joao.silva")
    payload = decode_token(token)
    assert payload["sub"] == "joao.silva"


def test_decode_invalid_token():
    from auth import decode_token
    assert decode_token("token.invalido.aqui") is None


def test_decode_expired_token():
    from auth import decode_token
    import jwt
    from config import JWT_SECRET
    payload = {"sub": "u", "exp": int(time.time()) - 1}
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    assert decode_token(token) is None


def test_pam_authenticate_import_error():
    from auth import pam_authenticate
    with patch.dict("sys.modules", {"pam": None}):
        assert pam_authenticate("u", "p") is False


def test_get_user_shares_matches_by_short_group():
    from auth import get_user_shares
    id_out = "uid=1000(joao) gid=513(domain users) groups=513(domain users),1001(financeiro)"
    with patch("auth.run_cmd", return_value=(id_out, "")):
        shares = get_user_shares("joao")
    assert any(s["name"] == "FINANCEIRO" for s in shares)


def test_get_user_shares_no_match():
    from auth import get_user_shares
    id_out = "uid=1000(joao) gid=513(domain users) groups=513(domain users)"
    with patch("auth.run_cmd", return_value=(id_out, "")):
        shares = get_user_shares("joao")
    assert shares == []


def test_get_user_shares_empty_id_output():
    from auth import get_user_shares
    with patch("auth.run_cmd", return_value=("", "")):
        shares = get_user_shares("joao")
    assert shares == []


def test_get_user_shares_excludes_local_shares():
    from auth import get_user_shares
    id_out = "uid=1000(comercial1) gid=513(domain users) groups=513(domain users),1002(comercial)"
    with patch("auth.run_cmd", return_value=(id_out, "")):
        shares = get_user_shares("comercial1")
    names = [s["name"] for s in shares]
    assert "COMERCIAL_VENDAS" not in names
    assert "LINKS_UTEIS" not in names
