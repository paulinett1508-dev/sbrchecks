#!/bin/bash
# setup-samba-ad.sh
# Integra o Samba ao AD (LABSOBRALNET.IND) via winbind.
# Pré-requisito: rodar como root (sudo bash setup-samba-ad.sh)
# AD: 192.86.221.218 | Domínio: LABSOBRALNET.IND

set -e

AD_DOMAIN="LABSOBRALNET.IND"
AD_IP="192.86.221.218"
REPO="/home/admin/labsrvfiles"
SMB_CONF="/etc/samba/smb.conf"
BACKUP="/etc/samba/smb.conf.bak.$(date +%Y%m%d_%H%M%S)"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── 1. Backup ──────────────────────────────────────────────
log "Backup: $BACKUP"
cp "$SMB_CONF" "$BACKUP"

# ── 2. Instalar winbind ────────────────────────────────────
log "Instalando winbind..."
apt-get install -y winbind libpam-winbind libnss-winbind krb5-user

# ── 3. Garantir resolução DNS via AD ──────────────────────
log "Verificando DNS para $AD_DOMAIN..."
if ! host "$AD_DOMAIN" "$AD_IP" &>/dev/null; then
    log "AVISO: DNS do AD ($AD_IP) não resolve $AD_DOMAIN — verifique /etc/resolv.conf"
fi

# ── 4. Implantar smb.conf do repositório ──────────────────
log "Implantando config: $REPO/config/smb.conf → $SMB_CONF"
cp "$REPO/config/smb.conf" "$SMB_CONF"

log "Validando sintaxe..."
testparm -s "$SMB_CONF"

# ── 5. Ingressar no domínio ────────────────────────────────
log "Ingressando no domínio $AD_DOMAIN..."
log "Informe a senha do administrador do domínio quando solicitado."
net ads join -U administrador

# ── 6. Reiniciar serviços ──────────────────────────────────
log "Reiniciando smbd, nmbd e winbind..."
systemctl restart smbd nmbd winbind

# ── 7. Verificação ─────────────────────────────────────────
log "Verificando winbind..."
wbinfo --ping-dc && log "DC acessível via winbind ✓" || log "ERRO: winbind não alcança o DC"

log "Listando portas Samba..."
ss -tlnp | grep -E '445|139'

log "Testando resolução do usuário pmiranda..."
id pmiranda 2>/dev/null && log "Usuário resolvido ✓" || log "Usuário não resolvido — verifique winbind"

log "Setup concluído. Teste: \\\\192.86.221.213\\TI"
