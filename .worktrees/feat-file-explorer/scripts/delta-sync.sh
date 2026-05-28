#!/bin/bash
# delta-sync.sh — sincroniza alterações do Google Drive para o servidor
#
# Executar ANTES do cutover. Usa rclone sync (detecta novos, modificados e deletados).
# Só processa drives cujo diretório de destino já existe (já migrados).
# Retomável: pula drives já marcados como DELTA-OK nesta sessão do log.
#
# Log: ~/delta-sync-gdrive.log
# Uso: bash ~/labsrvfiles/scripts/delta-sync.sh

SSD="/srv/samba/gdrive_import"
HDD="/mnt/hdd/gdrive_import"
HDD3="/mnt/hdd3/gdrive_import"
EXTERNO="/mnt/externo/gdrive_import"
REMOTE="gdrive-labsobral"
LOG="$HOME/delta-sync-gdrive.log"
TRANSFERS=4
CHECKERS=16
TPSLIMIT=5
DISK_MINIMO_GB=20

PID_FILE="/tmp/labsrv-deltasync.pid"
LOCK_FILE="/tmp/labsrv-deltasync.lock"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] AVISO: delta-sync já está rodando (PID $(cat $PID_FILE 2>/dev/null)). Saindo." >&2
    exit 1
fi
echo $$ > "$PID_FILE"
trap "rm -f '$PID_FILE' '$LOCK_FILE'; flock -u 9" EXIT

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
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
}

ja_sincronizado() {
    grep -q "<<< DELTA-OK: $1$" "$LOG" 2>/dev/null
}

sync_drive() {
    local name="$1" id="$2" dest_base="$3"
    local dest="$dest_base/$name"

    if [ ! -d "$dest" ]; then
        log ">>> PULANDO (diretório não encontrado): $name — $dest"
        return 0
    fi

    if ja_sincronizado "$name"; then
        log ">>> PULANDO (delta já feito): $name"
        return 0
    fi

    check_disk "$dest_base"
    log ">>> DELTA-SYNC: $name → $dest"

    rclone sync \
        "${REMOTE},team_drive=${id},root_folder_id=${id}:" \
        "$dest" \
        --transfers "$TRANSFERS" \
        --checkers "$CHECKERS" \
        --tpslimit "$TPSLIMIT" \
        --checksum \
        --drive-acknowledge-abuse \
        --drive-skip-dangling-shortcuts \
        --ignore-errors \
        --fast-list \
        --stats-one-line \
        --stats 60s \
        --log-level INFO \
        >> "$LOG" 2>&1

    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        log "<<< DELTA-OK: $name"
    else
        log "<<< DELTA-ERRO (código $exit_code): $name"
    fi
    echo "---" >> "$LOG"
}

log "====== INÍCIO DO DELTA SYNC ======"
log "SSD: $SSD | HDD: $HDD | HDD3: $HDD3 | EXTERNO: $EXTERNO"
df -h "$SSD" "$HDD" "$HDD3" "$EXTERNO" >> "$LOG" 2>&1

# ── SSD ───────────────────────────────────────────────────────────────────────
sync_drive "AMOSTRAGEM"                        "0AM9bA0jR3khtUk9PVA"  "$SSD"
sync_drive "ASSUNTOS_REGULATORIOS"             "0AE-lgz70ZL46Uk9PVA"  "$SSD"
sync_drive "COMERCIAL"                         "0AFt0ygoC_2HdUk9PVA"  "$SSD"
sync_drive "CONTABILIDADE"                     "0AGfUCI5zcIR1Uk9PVA"  "$SSD"
sync_drive "CONTROLE_files_research_PART1"     "0AJww3cOaaLm9Uk9PVA"  "$SSD"
sync_drive "CONTROLE_files_research_PART2"     "0ADE_pSEELO0qUk9PVA"  "$SSD"
sync_drive "CONTROLE_DA_QUALIDADE"             "0AEG4w39-I9FLUk9PVA"  "$SSD"
sync_drive "CQ_CONSULTAS_ATE_2019"             "0AJGIPDx_MSMgUk9PVA"  "$SSD"
sync_drive "DEPTO_PESSOAL"                     "0AFCNkPHfJ5QqUk9PVA"  "$SSD"
sync_drive "DEPTO_TECNICO"                     "0AIt4fV4pGGziUk9PVA"  "$SSD"
sync_drive "DRE_PROJETADO"                     "0AGwktq4lQzxaUk9PVA"  "$SSD"
sync_drive "FARMACOPEIAS"                      "0AM0G5iluQtNSUk9PVA"  "$SSD"
sync_drive "FARMACOVIGILANCIA"                 "0ANRdJ8RFUjSVUk9PVA"  "$SSD"
sync_drive "FINANCEIRO"                        "0AKf3PglVP3CEUk9PVA"  "$SSD"
sync_drive "GARANTIA"                          "0AC0UFgfLUGrtUk9PVA"  "$SSD"
sync_drive "IFS_HMLG"                          "0AC9ollY_anZ7Uk9PVA"  "$SSD"
sync_drive "IFS_PROD"                          "0AF3_kuuCB-k7Uk9PVA"  "$SSD"

# ── HDD3 ──────────────────────────────────────────────────────────────────────
sync_drive "INDUSTRIAL"                        "0AFwSL48iDII6Uk9PVA"  "$HDD3"
sync_drive "LOGISTICA"                         "0ALeD10WqsfdaUk9PVA"  "$HDD3"
sync_drive "MANUTENCAO"                        "0AMV9LFkQp94jUk9PVA"  "$HDD3"
sync_drive "METADADOS"                         "0AKSd1rElNyFTUk9PVA"  "$HDD3"
sync_drive "NOTIFIC_RJ"                        "0AOfS48Tp24X0Uk9PVA"  "$HDD3"
sync_drive "PCP_COMPRAS"                       "0AAmXchnohSnQUk9PVA"  "$HDD3"
sync_drive "PLANILHAS_COLABORATIVAS"           "0AMmiGErLuQ4-Uk9PVA"  "$HDD3"
sync_drive "PRODUCAO"                          "0AKF0mj45HdkDUk9PVA"  "$HDD3"
sync_drive "RECURSOS_HUMANOS"                  "0ADoXXTQ6uFDoUk9PVA"  "$HDD3"
sync_drive "REGULATORIO"                       "0APJ07weXFn8LUk9PVA"  "$HDD3"
sync_drive "RENOVACAO_LICENCA_AMBIENTAL_2026"  "0AMfuiC2IZC0GUk9PVA"  "$HDD3"
sync_drive "VALIDACAO"                         "0AEb73Y8fwXFmUk9PVA"  "$HDD3"

# ── HDD ───────────────────────────────────────────────────────────────────────
sync_drive "VENDAS"                            "0ABRWCXJbkEVDUk9PVA"  "$HDD"
sync_drive "ARQUIVOS_GERADORES"                "0AHJWbgsDRqDvUk9PVA"  "$HDD"
sync_drive "BOOK_DE_INDICADORES"               "0AA_reRHJqZhiUk9PVA"  "$HDD"
sync_drive "DIRETORIA_ADMIN_FINANCEIRA"        "0AFMm7LaZsr9EUk9PVA"  "$HDD"
sync_drive "DIRETORIA_TECNICA"                 "0AFSqFzKTnz0TUk9PVA"  "$HDD"
sync_drive "ENDOMARKETING"                     "0ADEuJJ-Uk_KeUk9PVA"  "$HDD"
sync_drive "IMAGENS_CAMERAS"                   "0ACg91Y742lKPUk9PVA"  "$HDD"
sync_drive "INDICADORES_POWER_BI"              "0AC2X48Ew1CIRUk9PVA"  "$HDD"
sync_drive "MALA_DIRETA_BD_IFS"                "0AJlEUSvuIwPQUk9PVA"  "$HDD"
sync_drive "POWERBI_DADOS"                     "0AGVAZ0eEvIajUk9PVA"  "$HDD"
sync_drive "SECRETARIA_EXECUTIVA"              "0AF1LDR7B9kZdUk9PVA"  "$HDD"
sync_drive "SEGURANCA_DO_TRABALHO"             "0ABk8vA9JLkZ_Uk9PVA"  "$HDD"

# ── EXTERNO ───────────────────────────────────────────────────────────────────
sync_drive "MARKETING"                         "0AKjqL2jAceRBUk9PVA"  "$EXTERNO"

log "====== DELTA SYNC CONCLUÍDO ======"
df -h "$SSD" "$HDD" "$HDD3" "$EXTERNO" >> "$LOG" 2>&1
