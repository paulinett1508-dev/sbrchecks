# panel/auth.py
import subprocess
import time
import json
import os
from datetime import datetime

from fastapi import Depends, HTTPException, Request


def run_cmd(cmd: list[str], timeout: int = 10) -> tuple[str, str]:
    """Execute a shell command and return (stdout, stderr)."""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.stderr.strip()
    except subprocess.TimeoutExpired:
        return "", f"Command timed out after {timeout}s"
    except Exception as e:
        return "", str(e)


def pam_authenticate(username: str, password: str) -> bool:
    """Authenticate username/password via PAM (Linux local + AD via SSSD)."""
    try:
        import pam
        return pam.pam().authenticate(username, password, service="login")
    except ImportError:
        # python-pam not available in dev (Windows); always fail safely
        return False


def check_admin_group(username: str) -> bool:
    """Return True if username belongs to any recognized admin group.

    Uses 'id <username>' to list all groups the user belongs to, then checks
    against the configured allow-list. This handles AD groups with localized
    names that 'getent group' may not resolve correctly.
    """
    import re
    from config import ADMIN_ALLOWED_GROUPS
    stdout, _ = run_cmd(["id", username])
    if not stdout:
        return False
    # Extract all group names from id output: uid=...(name) gid=...(name) groups=N(name),...
    user_groups = {g.lower() for g in re.findall(r'\(([^)]+)\)', stdout)}
    allowed = {g.lower() for g in ADMIN_ALLOWED_GROUPS}
    return bool(user_groups & allowed)


def get_user_role(username: str) -> str:
    """Return the panel role for username from roles.json. Default: readonly."""
    from config import ROLES_FILE
    if os.path.exists(ROLES_FILE):
        try:
            with open(ROLES_FILE) as f:
                return json.load(f).get(username, "readonly")
        except (IOError, ValueError):
            pass
    return "readonly"


def create_token(username: str, role: str) -> str:
    """Create a signed JWT for the given username and role."""
    import jwt
    from config import JWT_SECRET, JWT_EXPIRE_HOURS
    payload = {
        "sub": username,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT. Returns payload dict or None if invalid/expired."""
    import jwt
    from config import JWT_SECRET
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None


# ---------------------------------------------------------------------------
# FastAPI auth dependencies (here to avoid circular imports with main.py)
# ---------------------------------------------------------------------------

def get_current_user(request: Request) -> dict:
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    return payload


def require_role(*roles: str):
    """Dependency factory — raises 403 if current user's role not in `roles`."""
    def dep(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Permissão insuficiente")
        return user
    return dep


def log_admin_action(username: str, action: str) -> None:
    from config import ADMIN_ACTION_LOG
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {username}: {action}\n"
    try:
        with open(ADMIN_ACTION_LOG, "a") as f:
            f.write(line)
    except OSError:
        pass  # Non-fatal if log file not writable yet
