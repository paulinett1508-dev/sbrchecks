import os
import secrets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Localização persistente fora do diretório de deploy (sobrevive ao rsync --delete)
PERSISTENT_SECRET_FILE = os.path.expanduser("~/.labsrv-panel-secret")
SECRET_FILE = os.path.join(BASE_DIR, ".secret")  # legado — removido pelo rsync a cada deploy


def get_jwt_secret() -> str:
    """Load or generate the JWT secret key for token signing.

    Priority: JWT_SECRET env var > persistent file (~/.labsrv-panel-secret) > legacy .secret > generate new.
    O arquivo persistente fica fora do diretório de deploy e sobrevive ao rsync --delete.

    Returns:
        str: 64-character hexadecimal string
    """
    if "JWT_SECRET" in os.environ:
        return os.environ["JWT_SECRET"]

    for path in (PERSISTENT_SECRET_FILE, SECRET_FILE):
        if os.path.exists(path):
            with open(path, "r") as f:
                return f.read().strip()

    s = secrets.token_hex(32)
    old_umask = os.umask(0o077)
    try:
        with open(PERSISTENT_SECRET_FILE, "w") as f:
            f.write(s)
    except IOError as e:
        raise RuntimeError(f"Failed to write JWT secret to {PERSISTENT_SECRET_FILE}: {e}") from e
    finally:
        os.umask(old_umask)
    return s


JWT_SECRET = get_jwt_secret()
JWT_EXPIRE_HOURS = 8
PORT = 8080
HOST = "0.0.0.0"
MIGRATION_LOG        = os.path.expanduser("~/migrate-gdrive-all.log")
DELTA_SYNC_LOG       = os.path.expanduser("~/delta-sync-gdrive.log")
DELTA_SYNC_SCRIPT    = os.path.expanduser("~/labsrvfiles/scripts/delta-sync.sh")
BACKUP_GDRIVE_LOG    = os.path.expanduser("~/backup-to-gdrive.log")
BACKUP_GDRIVE_SCRIPT = os.path.expanduser("~/labsrvfiles/scripts/backup-to-gdrive.sh")
CUTOVER_FILE         = os.path.expanduser("~/labsrv-cutover.json")
MIGRATION_DEST_SSD  = "/srv/samba/gdrive_import"   # deptos críticos / alta operação
MIGRATION_DEST_HDD  = "/mnt/hdd/gdrive_import"     # deptos secundários
MIGRATION_DEST_HDD3    = "/mnt/hdd3/gdrive_import"    # overflow SSD: LOGISTICA, VENDAS, VALIDACAO, RECURSOS_HUMANOS, REGULATORIO
MIGRATION_DEST_EXTERNO = "/mnt/externo/gdrive_import" # HD externo Toshiba 916 GB: MARKETING
MIGRATION_DEST      = MIGRATION_DEST_SSD           # legado — usado por _folder_sizes no painel
BACKUP_LOG = "/var/log/backup-labsrv.log"
SAMBA_AUDIT_LOG = "/var/log/samba/audit.log"
ADMIN_ACTION_LOG = "/var/log/labsrv-panel-admin.log"
ROLES_FILE = os.path.join(BASE_DIR, "roles.json")
AD_ADMIN_GROUP = "LABSOBRALNET\\Administradores"  # mantido por compatibilidade
ADMIN_ALLOWED_GROUPS = [
    "grupo admin",           # GID 108201553 — grupo admin AD
    "admins. do domínio",    # GID 108200512 — Domain Admins (PT)
    "grupo administradores", # GID 108201260 — administradores locais AD
    "ti",                    # GID 1018 — grupo TI local
    "admin",                 # GID 1001 — usuário local admin
]
SERVICES = ["smbd", "nmbd", "sssd", "ufw"]
# DISK_MOUNTS removido — detecção automática via findmnt em api/discos.py
DISK_ALERT_FILE = "/var/log/labsrv-disk-alert.json"
DISK_ALERT_THRESHOLD = 80
ALERTS_FILE = os.path.expanduser("~/labsrv-alerts.json")
