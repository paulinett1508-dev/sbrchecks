#!/bin/bash
# migrate-watchdog.sh — monitora a migração e reinicia se travar
#
# Considera travado se o log não teve nenhuma linha nova em TIMEOUT_MIN minutos.
# Instalar via cron: */15 * * * * /home/admin/labsrvfiles/scripts/migrate-watchdog.sh
#
# Log: /var/log/migrate-watchdog.log

MIGRATION_SCRIPT="$HOME/labsrvfiles/scripts/migrate-gdrive-all.sh"
MIGRATION_LOG="$HOME/migrate-gdrive-all.log"
WATCHDOG_LOG="/var/log/migrate-watchdog.log"
TIMEOUT_MIN=90   # reinicia se log ficar sem atualização por 90 minutos (--fast-list pode levar tempo na fase de listagem)

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$WATCHDOG_LOG"
}

# Garante que rclone.conf pertence ao admin.
# Usa "sudo rsync --chown" (NOPASSWD) pois sudo chown não está liberado.
RCLONE_CONF="$HOME/.config/rclone/rclone.conf"
if [ -f "$RCLONE_CONF" ] && [ "$(stat -c '%U' "$RCLONE_CONF")" != "admin" ]; then
    log "ALERTA: rclone.conf com dono '$(stat -c '%U' "$RCLONE_CONF")' — corrigindo via sudo rsync"
    tmp=$(mktemp /tmp/rclone_fix.XXXXXX)
    rm -f "$tmp"
    sudo rsync --chown=admin:admin "$RCLONE_CONF" "$tmp" && \
    sudo rsync --chown=admin:admin "$tmp" "$RCLONE_CONF" && \
    rm -f "$tmp" && \
    log "rclone.conf corrigido OK (dono agora: $(stat -c '%U' "$RCLONE_CONF"))" || \
    log "ERRO: falha ao corrigir rclone.conf"
fi

# Verifica uso de disco em todos os dispositivos (alerta se > 80%)
DISK_THRESHOLD=80
df -h --output=target,pcent / /mnt/hdd /mnt/hdd3 /mnt/externo 2>/dev/null | tail -n +2 | while read mount pct; do
    pct_num="${pct%%%}"
    if [ "${pct_num:-0}" -ge "$DISK_THRESHOLD" ]; then
        avail=$(df -h --output=avail "$mount" 2>/dev/null | tail -1 | tr -d ' ')
        if [ "${pct_num:-0}" -ge 90 ]; then
            log "CRÍTICO: $mount em ${pct} de uso — ${avail} livres"
        else
            log "AVISO: $mount em ${pct} de uso — ${avail} livres"
        fi
    fi
done

# Não reinicia se a migração já foi concluída com sucesso
if grep -qF "====== MIGRAÇÃO CONCLUÍDA ======" "$MIGRATION_LOG" 2>/dev/null; then
    log "Migração já concluída — watchdog encerrado sem ação."
    exit 0
fi

# Verifica se o processo está rodando
pid=$(pgrep -f "migrate-gdrive-all.sh" | head -1)

if [ -z "$pid" ]; then
    log "PROCESSO NÃO ENCONTRADO — reiniciando migração"
    # Garante que não há rclone órfão antes de reiniciar
    pkill -f "rclone copy.*gdrive-labsobral" 2>/dev/null
    sleep 3
    nohup bash "$MIGRATION_SCRIPT" > /dev/null 2>&1 &
    log "Novo PID: $!"
    exit 0
fi

# Verifica se o log foi atualizado nos últimos TIMEOUT_MIN minutos
if [ ! -f "$MIGRATION_LOG" ]; then
    log "LOG NÃO ENCONTRADO — possível problema"
    exit 1
fi

last_mod=$(stat -c %Y "$MIGRATION_LOG")
now=$(date +%s)
age_min=$(( (now - last_mod) / 60 ))

if [ "$age_min" -ge "$TIMEOUT_MIN" ]; then
    log "TRAVADO: log sem atualização há ${age_min} minutos (PID $pid) — reiniciando"
    # Captura contexto do travamento antes de matar o processo
    log "--- CONTEXTO DO TRAVAMENTO (últimas 20 linhas do log de migração) ---"
    tail -20 "$MIGRATION_LOG" | while IFS= read -r line; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')]   $line" >> "$WATCHDOG_LOG"
    done
    log "--- FIM DO CONTEXTO ---"
    kill "$pid" 2>/dev/null
    # Mata processos rclone órfãos deixados por reinícios anteriores
    pkill -f "rclone copy.*gdrive-labsobral" 2>/dev/null
    sleep 5
    nohup bash "$MIGRATION_SCRIPT" > /dev/null 2>&1 &
    log "Novo PID: $!"
else
    log "OK: PID $pid ativo, log atualizado há ${age_min} minutos"
fi
