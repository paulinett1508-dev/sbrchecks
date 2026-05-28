import os
import secrets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SECRET_FILE = os.path.join(BASE_DIR, ".secret")


def get_jwt_secret() -> str:
    """Load or generate the JWT secret key for token signing.

    Priority: JWT_SECRET env var > .secret file > generate new.
    New secrets are written atomically with restricted permissions (0o600).

    Returns:
        str: 64-character hexadecimal string
    Raises:
        RuntimeError: If file operations fail
    """
    if "JWT_SECRET" in os.environ:
        return os.environ["JWT_SECRET"]

    if os.path.exists(SECRET_FILE):
        with open(SECRET_FILE, "r") as f:
            return f.read().strip()

    s = secrets.token_hex(32)
    old_umask = os.umask(0o077)
    try:
        with open(SECRET_FILE, "w") as f:
            f.write(s)
    except IOError as e:
        raise RuntimeError(f"Failed to write JWT secret to {SECRET_FILE}: {e}") from e
    finally:
        os.umask(old_umask)
    return s


JWT_SECRET = get_jwt_secret()
JWT_EXPIRE_HOURS = 8
PORT = 8080
HOST = "0.0.0.0"
MIGRATION_LOG  = os.path.expanduser("~/migrate-gdrive.log")
DELTA_SYNC_LOG = "/var/log/delta-sync-gdrive.log"
MIGRATION_DEST = "/mnt/hdd3/gdrive_import"
BACKUP_LOG = "/var/log/backup-labsrv.log"
SAMBA_AUDIT_LOG = "/var/log/samba/audit.log"
ADMIN_ACTION_LOG = "/var/log/labsrv-panel-admin.log"
ROLES_FILE = os.path.join(BASE_DIR, "roles.json")
AD_ADMIN_GROUP = "LABSOBRALNET\\Administradores"
SERVICES = ["smbd", "nmbd", "sssd", "ufw"]
DISK_MOUNTS = ["/", "/mnt/hdd", "/mnt/hdd2/backups", "/mnt/hdd3"]
DISK_ALERT_FILE = "/var/log/labsrv-disk-alert.json"
DISK_ALERT_THRESHOLD = 80
