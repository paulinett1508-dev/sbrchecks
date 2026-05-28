#!/bin/bash
# Consulta AD via conta de máquina e grava cache JSON de usuários ativos.
# Executado como root via cron. Lido pelo painel via /opt/labsrv-panel/ad-users-cache.json
set -euo pipefail

OUT=/opt/labsrv-panel/ad-users-cache.json
TMP=$(mktemp)

net ads search -P \
  '(&(objectClass=user)(!(objectClass=computer))(!(userAccountControl:1.2.840.113556.1.4.803:=2)))' \
  sAMAccountName displayName department userAccountControl \
  2>/dev/null | python3 - << 'PYEOF'
import sys, json

users = []
cur = {}
for raw in sys.stdin:
    line = raw.rstrip()
    if line.startswith('dn:') and cur:
        if cur.get('sAMAccountName'):
            users.append(cur)
        cur = {}
    elif ':' in line and not line.startswith('#') and not line.startswith('search:') and not line.startswith('result:'):
        k, _, v = line.partition(':')
        k = k.strip()
        v = v.strip()
        if k and v:
            cur[k] = v

if cur.get('sAMAccountName'):
    users.append(cur)

print(json.dumps({'users': users, 'total': len(users)}))
PYEOF

mv "$TMP" "$OUT"
chmod 644 "$OUT"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ad-refresh: ${#} usuários gravados em $OUT"
