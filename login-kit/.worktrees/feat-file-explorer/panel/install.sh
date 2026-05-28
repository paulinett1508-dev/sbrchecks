#!/usr/bin/env bash
set -euo pipefail
PANEL_DIR="/opt/labsrv-panel"
REPO_PANEL="$(cd "$(dirname "$0")" && pwd)"

echo "=== LABSRVFILES Admin Panel — Instalação ==="

sudo apt-get update -qq
sudo apt-get install -y python3-pip libpam-python python3-pam

sudo mkdir -p "$PANEL_DIR"
sudo chown admin:admin "$PANEL_DIR"

rsync -av --exclude='.secret' --exclude='roles.json' "$REPO_PANEL/" "$PANEL_DIR/"

pip3 install --quiet -r "$PANEL_DIR/requirements.txt"

if [ ! -f "$PANEL_DIR/.secret" ]; then
    python3 -c "import secrets; open('$PANEL_DIR/.secret','w').write(secrets.token_hex(32))"
    chmod 600 "$PANEL_DIR/.secret"
    echo "JWT secret gerado."
fi

if [ ! -f "$PANEL_DIR/roles.json" ]; then
    echo '{"admin": "superadmin"}' > "$PANEL_DIR/roles.json"
    echo "roles.json criado com admin=superadmin."
fi

sudo touch /var/log/labsrv-panel-admin.log
sudo chown admin:admin /var/log/labsrv-panel-admin.log
# Append-only: nem root apaga linhas do log
sudo chattr +a /var/log/labsrv-panel-admin.log 2>/dev/null || true

# Wrapper script: validates PID is numeric before sending SIGHUP to samba process
sudo mkdir -p /opt/labsrv-panel/bin
sudo tee /opt/labsrv-panel/bin/samba-hup-pid.sh > /dev/null << 'WRAPPER'
#!/bin/bash
PID="$1"
if [[ ! "$PID" =~ ^[0-9]+$ ]]; then
    echo "Invalid PID: $PID" >&2
    exit 1
fi
kill -HUP "$PID"
WRAPPER
sudo chmod 755 /opt/labsrv-panel/bin/samba-hup-pid.sh

SUDOERS_CONTENT="admin ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart smbd, /usr/bin/systemctl restart nmbd, /usr/bin/systemctl restart sssd, /usr/sbin/smbcontrol, /opt/labsrv-panel/bin/samba-hup-pid.sh"
echo "$SUDOERS_CONTENT" | sudo tee /etc/sudoers.d/labsrv-panel > /dev/null
sudo chmod 440 /etc/sudoers.d/labsrv-panel

sudo cp "$PANEL_DIR/labsrv-panel.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable labsrv-panel
sudo systemctl restart labsrv-panel

sudo ufw allow from 192.86.221.0/24 to any port 8080 comment "labsrv-panel" 2>/dev/null || true

echo ""
echo "=== Configuração Samba Audit (executar uma vez) ==="
echo "Adicionar em /etc/samba/smb.conf em cada [share]:"
echo "  vfs objects = recycle full_audit"
echo "  full_audit:prefix = %u|%I|%S"
echo "  full_audit:success = open opendir create write rename delete"
echo "  full_audit:failure = open create"
echo "  full_audit:facility = local5"
echo "  full_audit:priority = notice"
echo ""
echo "  recycle:repository = .recycle"
echo "  recycle:keeptree = yes"
echo "  recycle:versions = yes"
echo ""
echo "Em /etc/rsyslog.d/samba-audit.conf:"
echo "  local5.notice /var/log/samba/audit.log"
echo ""
echo "Depois: sudo systemctl restart smbd rsyslog"
echo ""
echo "Painel disponivel em http://192.86.221.213:8080"
