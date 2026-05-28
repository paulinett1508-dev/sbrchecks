#!/bin/bash
# disk-alert.sh — monitora uso dos discos e registra alertas
# Grava em /var/log/labsrv-disk-alert.json (lido pelo painel administrativo)
# Instalar via cron: */5 * * * * /home/admin/labsrvfiles/scripts/disk-alert.sh

ALERT_FILE="/var/log/labsrv-disk-alert.json"
THRESHOLD=80
MOUNTS=("/" "/mnt/hdd" "/mnt/hdd2/backups" "/mnt/hdd3")

alerts=()
checked_at=$(date '+%Y-%m-%d %H:%M:%S')

for mount in "${MOUNTS[@]}"; do
    line=$(df -h --output=source,target,size,used,avail,pcent "$mount" 2>/dev/null | tail -1)
    [ -z "$line" ] && continue

    pct=$(echo "$line" | awk '{print $6}' | tr -d '%')
    device=$(echo "$line" | awk '{print $1}')
    avail=$(echo "$line" | awk '{print $5}')
    total=$(echo "$line" | awk '{print $3}')

    if [ -n "$pct" ] && [ "$pct" -ge "$THRESHOLD" ] 2>/dev/null; then
        alerts+=("{\"mount\":\"$mount\",\"device\":\"$device\",\"percent\":$pct,\"avail\":\"$avail\",\"size\":\"$total\"}")
    fi
done

# Monta JSON
json="{\"checked_at\":\"$checked_at\",\"threshold\":$THRESHOLD,\"alerts\":["
first=1
for alert in "${alerts[@]}"; do
    [ $first -eq 0 ] && json+=","
    json+="$alert"
    first=0
done
json+="]}"

echo "$json" > "$ALERT_FILE"

# Loga no syslog se houver alertas
if [ ${#alerts[@]} -gt 0 ]; then
    logger -t labsrv-disk-alert "ALERTA: ${#alerts[@]} disco(s) acima de ${THRESHOLD}% — verifique $ALERT_FILE"
fi
