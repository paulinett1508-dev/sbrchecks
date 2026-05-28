# panel/tests/test_auth.py
from unittest.mock import patch, mock_open, MagicMock
import sys, os
import json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from auth import create_token, decode_token, check_admin_group, get_user_role, pam_authenticate

def test_create_and_decode_token():
    token = create_token("joao.silva", "operador")
    payload = decode_token(token)
    assert payload["sub"] == "joao.silva"
    assert payload["role"] == "operador"

def test_decode_invalid_token():
    assert decode_token("token.invalido.aqui") is None

def test_check_admin_group_member():
    with patch("auth.run_cmd", return_value=("Administradores:x:10001:admin,joao.silva", "")):
        assert check_admin_group("joao.silva") is True

def test_check_admin_group_non_member():
    with patch("auth.run_cmd", return_value=("Administradores:x:10001:admin", "")):
        assert check_admin_group("pedro.fora") is False

def test_check_admin_group_empty_output():
    with patch("auth.run_cmd", return_value=("", "")):
        assert check_admin_group("joao.silva") is False

def test_pam_authenticate_import_error():
    """pam_authenticate returns False when python-pam is not available."""
    with patch.dict("sys.modules", {"pam": None}):
        result = pam_authenticate("user", "pass")
    assert result is False

def test_get_user_role_returns_stored_role():
    """get_user_role returns role from roles.json."""
    roles_data = json.dumps({"joao.silva": "superadmin"})
    with patch("os.path.exists", return_value=True):
        with patch("builtins.open", mock_open(read_data=roles_data)):
            assert get_user_role("joao.silva") == "superadmin"

def test_get_user_role_defaults_to_readonly():
    """get_user_role returns readonly when user not in roles.json."""
    roles_data = json.dumps({"outro.user": "operador"})
    with patch("os.path.exists", return_value=True):
        with patch("builtins.open", mock_open(read_data=roles_data)):
            assert get_user_role("desconhecido") == "readonly"

def test_get_user_role_file_missing():
    """get_user_role returns readonly when roles.json does not exist."""
    with patch("os.path.exists", return_value=False):
        assert get_user_role("qualquer") == "readonly"
