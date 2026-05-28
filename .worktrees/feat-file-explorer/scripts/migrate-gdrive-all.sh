#!/bin/bash
# migrate-gdrive-all.sh
# Migra todos os Drives Compartilhados do Google Drive para o servidor local.
# Retomável: rclone pula arquivos já transferidos.
# Log: ~/migrate-gdrive-all.log

SSD="/srv/samba/gdrive_import"
HDD="/mnt/hdd/gdrive_import"
HDD3="/mnt/hdd3/gdrive_import"
EXTERNO="/mnt/externo/gdrive_import"
REMOTE="gdrive-labsobral"
LOG="$HOME/migrate-gdrive-all.log"
STATE_FILE="$HOME/.migrate-gdrive-state"   # drives concluídos (1 por linha, rápido)
TRANSFERS=64
CHECKERS=128
TPSLIMIT=0
PACER_SLEEP=1ms
DISK_MINIMO_GB=30

PID_FILE="/tmp/labsrv-migration.pid"
LOCK_FILE="/tmp/labsrv-migration.lock"

# ── Singleton: garante que apenas uma instância rode ──────────────────────────
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] AVISO: migração já está rodando (PID $(cat $PID_FILE 2>/dev/null)). Saindo." >&2
    exit 1
fi

echo $$ > "$PID_FILE"
trap "rm -f '$PID_FILE' '$LOCK_FILE'; flock -u 9" EXIT

# ── log: escreve APENAS no arquivo (stdout não vai para o log) ────────────────
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"
}

check_disk() {
    local dest_base="$1"
    local livre_kb livre_gb
    livre_kb=$(df "$dest_base" | awk 'NR==2 {print $4}')
    livre_gb=$(( livre_kb / 1024 / 1024 ))
    if [ "$livre_gb" -lt "$DISK_MINIMO_GB" ]; then
        log "ALERTA: disco com apenas ${livre_gb} GB livres em $dest_base — abortando."
        exit 1
    fi
    log "Disco: ${livre_gb} GB livres em $dest_base"
}

# State file para checagem rápida — evita grep em log gigante
ja_concluido() {
    grep -qxF "$1" "$STATE_FILE" 2>/dev/null
}

marcar_concluido() {
    echo "$1" >> "$STATE_FILE"
}

migrate_drive() {
    local name="$1" id="$2" dest_base="$3"
    local dest="$dest_base/$name"

    if ja_concluido "$name"; then
        log ">>> PULANDO (já concluído): $name"
        return 0
    fi

    check_disk "$dest_base"
    log ">>> INICIANDO: $name → $dest_base (ID: $id)"
    mkdir -p "$dest"

    local line_before
    line_before=$(wc -l < "$LOG" 2>/dev/null || echo 0)

    rclone copy \
        "${REMOTE},team_drive=${id},root_folder_id=${id}:" \
        "$dest" \
        --transfers "$TRANSFERS" \
        --checkers "$CHECKERS" \
        --tpslimit "$TPSLIMIT" \
        --drive-pacer-min-sleep "$PACER_SLEEP" \
        --drive-acknowledge-abuse \
        --drive-skip-dangling-shortcuts \
        --ignore-errors \
        --fast-list \
        --log-level INFO \
        --stats 30s \
        >> "$LOG" 2>&1

    local exit_code=$?
    local err_count
    err_count=$(tail -n +"$((line_before + 1))" "$LOG" 2>/dev/null | grep -c " ERROR ") || true

    if [ "$exit_code" -eq 0 ]; then
        log "<<< CONCLUÍDO: $name"
        marcar_concluido "$name"
        [ "${err_count:-0}" -gt 0 ] && log "!!! ATENÇÃO: $err_count arquivo(s) com erro em $name"
    else
        log "<<< ERRO (código $exit_code): $name — verifique o log"
    fi
    echo "---" >> "$LOG"
}

# ── Início ────────────────────────────────────────────────────────────────────
log "====== INÍCIO DA MIGRAÇÃO ======"
log "SSD destino: $SSD | HDD: $HDD | HDD3: $HDD3 | EXTERNO: $EXTERNO"
log "TRANSFERS=$TRANSFERS CHECKERS=$CHECKERS TPSLIMIT=$TPSLIMIT"
df -h "$SSD" "$HDD" "$HDD3" "$EXTERNO" >> "$LOG" 2>&1

# ── SSD — deptos críticos / alta operação ─────────────────────────────────────
migrate_drive "AMOSTRAGEM"                        "0AM9bA0jR3khtUk9PVA"  "$SSD"
migrate_drive "ASSUNTOS_REGULATORIOS"             "0AE-lgz70ZL46Uk9PVA"  "$SSD"
migrate_drive "COMERCIAL"                         "0AFt0ygoC_2HdUk9PVA"  "$SSD"
migrate_drive "CONTABILIDADE"                     "0AGfUCI5zcIR1Uk9PVA"  "$SSD"
migrate_drive "CONTROLE_files_research_PART1"     "0AJww3cOaaLm9Uk9PVA"  "$SSD"
migrate_drive "CONTROLE_files_research_PART2"     "0ADE_pSEELO0qUk9PVA"  "$SSD"
migrate_drive "CONTROLE_DA_QUALIDADE"             "0AEG4w39-I9FLUk9PVA"  "$SSD"
migrate_drive "CQ_CONSULTAS_ATE_2019"             "0AJGIPDx_MSMgUk9PVA"  "$SSD"
migrate_drive "DEPTO_PESSOAL"                     "0AFCNkPHfJ5QqUk9PVA"  "$SSD"
migrate_drive "DEPTO_TECNICO"                     "0AIt4fV4pGGziUk9PVA"  "$SSD"
migrate_drive "DRE_PROJETADO"                     "0AGwktq4lQzxaUk9PVA"  "$SSD"
migrate_drive "FARMACOPEIAS"                      "0AM0G5iluQtNSUk9PVA"  "$SSD"
migrate_drive "FARMACOVIGILANCIA"                 "0ANRdJ8RFUjSVUk9PVA"  "$SSD"
migrate_drive "FINANCEIRO"                        "0AKf3PglVP3CEUk9PVA"  "$SSD"
migrate_drive "GARANTIA"                          "0AC0UFgfLUGrtUk9PVA"  "$SSD"
migrate_drive "IFS_HMLG"                          "0AC9ollY_anZ7Uk9PVA"  "$SSD"
migrate_drive "IFS_PROD"                          "0AF3_kuuCB-k7Uk9PVA"  "$SSD"
migrate_drive "INDUSTRIAL"                        "0AFwSL48iDII6Uk9PVA"  "$HDD3"
migrate_drive "LOGISTICA"                         "0ALeD10WqsfdaUk9PVA"  "$HDD3"
migrate_drive "MANUTENCAO"                        "0AMV9LFkQp94jUk9PVA"  "$HDD3"
migrate_drive "METADADOS"                         "0AKSd1rElNyFTUk9PVA"  "$HDD3"
migrate_drive "NOTIFIC_RJ"                        "0AOfS48Tp24X0Uk9PVA"  "$HDD3"
migrate_drive "PCP_COMPRAS"                       "0AAmXchnohSnQUk9PVA"  "$HDD3"
migrate_drive "PLANILHAS_COLABORATIVAS"           "0AMmiGErLuQ4-Uk9PVA"  "$HDD3"
migrate_drive "PRODUCAO"                          "0AKF0mj45HdkDUk9PVA"  "$HDD3"
migrate_drive "RECURSOS_HUMANOS"                  "0ADoXXTQ6uFDoUk9PVA"  "$HDD3"
migrate_drive "REGULATORIO"                       "0APJ07weXFn8LUk9PVA"  "$HDD3"
migrate_drive "RENOVACAO_LICENCA_AMBIENTAL_2026"  "0AMfuiC2IZC0GUk9PVA"  "$HDD3"
migrate_drive "VALIDACAO"                         "0AEb73Y8fwXFmUk9PVA"  "$HDD3"
migrate_drive "VENDAS"                            "0ABRWCXJbkEVDUk9PVA"  "$HDD"

# ── HDD — deptos secundários ──────────────────────────────────────────────────
migrate_drive "ARQUIVOS_GERADORES"                "0AHJWbgsDRqDvUk9PVA"  "$HDD"
migrate_drive "BOOK_DE_INDICADORES"               "0AA_reRHJqZhiUk9PVA"  "$HDD"
migrate_drive "DIRETORIA_ADMIN_FINANCEIRA"        "0AFMm7LaZsr9EUk9PVA"  "$HDD"
migrate_drive "DIRETORIA_TECNICA"                 "0AFSqFzKTnz0TUk9PVA"  "$HDD"
migrate_drive "ENDOMARKETING"                     "0ADEuJJ-Uk_KeUk9PVA"  "$HDD"
migrate_drive "IMAGENS_CAMERAS"                   "0ACg91Y742lKPUk9PVA"  "$HDD"
migrate_drive "INDICADORES_POWER_BI"              "0AC2X48Ew1CIRUk9PVA"  "$HDD"
migrate_drive "MALA_DIRETA_BD_IFS"               "0AJlEUSvuIwPQUk9PVA"  "$HDD"
migrate_drive "MARKETING"                         "0AKjqL2jAceRBUk9PVA"  "$EXTERNO"
migrate_drive "POWERBI_DADOS"                     "0AGVAZ0eEvIajUk9PVA"  "$HDD"
migrate_drive "PUBLICO_GDRV"                      "0ABKMx1h2qdm2Uk9PVA"  "$HDD"
migrate_drive "SECRETARIA_EXECUTIVA"              "0AF1LDR7B9kZdUk9PVA"  "$HDD"
migrate_drive "SEGURANCA_DO_TRABALHO"             "0ABk8vA9JLkZ_Uk9PVA"  "$HDD"

log "====== MIGRAÇÃO CONCLUÍDA ======"
df -h "$SSD" "$HDD" "$HDD3" "$EXTERNO" >> "$LOG" 2>&1
