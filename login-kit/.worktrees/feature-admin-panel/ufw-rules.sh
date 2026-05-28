#!/bin/bash
# =============================================================
# ufw-rules.sh — Regras de Firewall do LABSRVFILES
# Servidor de Arquivos — Laboratório Sobral
# Aplicar com: sudo bash ufw-rules.sh
# =============================================================

set -euo pipefail

echo "[UFW] Aplicando regras do LABSRVFILES..."

# Reset sem desabilitar (mantém SSH)
ufw --force reset

# Política padrão
ufw default deny incoming
ufw default allow outgoing

# ─────────────────────────────────────────
# SSH — acesso administrativo
# ─────────────────────────────────────────
ufw allow 22/tcp comment 'SSH admin'

# ─────────────────────────────────────────
# Samba / SMB — compartilhamento de arquivos
# ─────────────────────────────────────────
ufw allow 445/tcp  comment 'SMB (Samba)'
ufw allow 139/tcp  comment 'NetBIOS Session (Samba)'
ufw allow 137/udp  comment 'NetBIOS Name Service'
ufw allow 138/udp  comment 'NetBIOS Datagram'

# ─────────────────────────────────────────
# Active Directory / Kerberos / LDAP
# ─────────────────────────────────────────
ufw allow 88/tcp   comment 'Kerberos (AD)'
ufw allow 88/udp   comment 'Kerberos (AD)'
ufw allow 389/tcp  comment 'LDAP (AD)'
ufw allow 636/tcp  comment 'LDAPS (AD)'
ufw allow 3268/tcp comment 'Global Catalog LDAP'
ufw allow 3269/tcp comment 'Global Catalog LDAPS'

# ─────────────────────────────────────────
# DNS — resolução de nomes do domínio
# ─────────────────────────────────────────
ufw allow 53/tcp   comment 'DNS'
ufw allow 53/udp   comment 'DNS'

# ─────────────────────────────────────────
# NTP — sincronização de relógio (AD exige)
# ─────────────────────────────────────────
ufw allow 123/udp  comment 'NTP'

# ─────────────────────────────────────────
# Habilitar UFW
# ─────────────────────────────────────────
ufw --force enable

echo ""
echo "[UFW] Regras aplicadas com sucesso:"
ufw status numbered
