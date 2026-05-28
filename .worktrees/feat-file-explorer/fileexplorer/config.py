# fileexplorer/config.py
import os
import secrets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PERSISTENT_SECRET_FILE = os.path.expanduser("~/.labsrv-files-secret")


def _get_jwt_secret() -> str:
    if "FILES_JWT_SECRET" in os.environ:
        return os.environ["FILES_JWT_SECRET"]
    if os.path.exists(PERSISTENT_SECRET_FILE):
        with open(PERSISTENT_SECRET_FILE) as f:
            return f.read().strip()
    s = secrets.token_hex(32)
    old = os.umask(0o077)
    try:
        with open(PERSISTENT_SECRET_FILE, "w") as f:
            f.write(s)
    finally:
        os.umask(old)
    return s


PORT = 8081
HOST = "0.0.0.0"
JWT_SECRET = _get_jwt_secret()
JWT_EXPIRE_HOURS = 8
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MB
AUDIT_DB = os.environ.get("AUDIT_DB", "/opt/labsrv-files/audit.db")
SHARES_DB = os.environ.get("SHARES_DB", "/opt/labsrv-files/shares.db")
