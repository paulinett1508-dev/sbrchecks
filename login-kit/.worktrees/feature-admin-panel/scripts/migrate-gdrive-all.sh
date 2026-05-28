#!/bin/bash
# migrate-gdrive-all.sh
# Migra todos os Drives Compartilhados do Google Drive para /mnt/hdd3/gdrive_import/
# Retomável: rclone pula arquivos já transferidos
# Log: /var/log/migrate-gdrive-all.log

DEST_BASE="/mnt/hdd3/gdrive_import"
REMOTE="gdrive-labsobral"
LOG="$HOME/migrate-gdrive-all.log"
TRANSFERS=4
DISK_MINIMO_GB=30  # aborta se restar menos que isso no disco

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

check_disk() {
    local livre_kb
    livre_kb=$(df "$DEST_BASE" | awk 'NR==2 {print $4}')
    local livre_gb=$(( livre_kb / 1024 / 1024 ))
    if [ "$livre_gb" -lt "$DISK_MINIMO_GB" ]; then
        log "ALERTA: disco com apenas ${livre_gb} GB livres — abortando para evitar disco cheio."
        exit 1
    fi
    log "Disco: ${livre_gb} GB livres em $DEST_BASE"
}

ja_concluido() {
    grep -q "<<< CONCLUÍDO: $1$" "$LOG" 2>/dev/null
}

migrate_drive() {
    local name="$1"
    local id="$2"
    local dest="$DEST_BASE/$name"

    if ja_concluido "$name"; then
        log ">>> PULANDO (já concluído): $name"
        return 0
    fi

    check_disk
    log ">>> INICIANDO: $name (ID: $id)"
    mkdir -p "$dest"

    rclone copy \
        "${REMOTE},team_drive=${id},root_folder_id=${id}:" \
        "$dest" \
        --transfers "$TRANSFERS" \
        --stats-one-line \
        --stats 60s \
        2>&1 >> "$LOG"

    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        log "<<< CONCLUÍDO: $name"
    else
        log "<<< ERRO (código $exit_code): $name — verifique o log"
    fi
    echo "---" >> "$LOG"
}

log "====== INÍCIO DA MIGRAÇÃO ======"
log "Destino base: $DEST_BASE"
df -h "$DEST_BASE" | tee -a "$LOG"
echo ""

# TI já está sendo migrado para /mnt/hdd/samba/TI — pulado aqui
# Para re-migrar TI para gdrive_import também, descomente a linha abaixo:
# migrate_drive "TI"                              "0AC4h1xyLIQ8OUk9PVA"

migrate_drive "AMOSTRAGEM"                        "0AM9bA0jR3khtUk9PVA"
migrate_drive "ARQUIVOS_GERADORES"                "0AHJWbgsDRqDvUk9PVA"
migrate_drive "ASSUNTOS_REGULATORIOS"             "0AE-lgz70ZL46Uk9PVA"
migrate_drive "BOOK_DE_INDICADORES"               "0AA_reRHJqZhiUk9PVA"
migrate_drive "COMERCIAL"                         "0AFt0ygoC_2HdUk9PVA"
migrate_drive "CONTABILIDADE"                     "0AGfUCI5zcIR1Uk9PVA"
migrate_drive "CONTROLE_files_research_PART1"     "0AJww3cOaaLm9Uk9PVA"
migrate_drive "CONTROLE_files_research_PART2"     "0ADE_pSEELO0qUk9PVA"
migrate_drive "CONTROLE_DA_QUALIDADE"             "0AEG4w39-I9FLUk9PVA"
migrate_drive "CQ_CONSULTAS_ATE_2019"             "0AJGIPDx_MSMgUk9PVA"
migrate_drive "DEPTO_PESSOAL"                     "0AFCNkPHfJ5QqUk9PVA"
migrate_drive "DEPTO_TECNICO"                     "0AIt4fV4pGGziUk9PVA"
migrate_drive "DIRETORIA_ADMIN_FINANCEIRA"        "0AFMm7LaZsr9EUk9PVA"
migrate_drive "DIRETORIA_TECNICA"                 "0AFSqFzKTnz0TUk9PVA"
migrate_drive "DRE_PROJETADO"                     "0AGwktq4lQzxaUk9PVA"
migrate_drive "ENDOMARKETING"                     "0ADEuJJ-Uk_KeUk9PVA"
migrate_drive "FARMACOPEIAS"                      "0AM0G5iluQtNSUk9PVA"
migrate_drive "FARMACOVIGILANCIA"                 "0ANRdJ8RFUjSVUk9PVA"
migrate_drive "FINANCEIRO"                        "0AKf3PglVP3CEUk9PVA"
migrate_drive "GARANTIA"                          "0AC0UFgfLUGrtUk9PVA"
migrate_drive "IFS_HMLG"                          "0AC9ollY_anZ7Uk9PVA"
migrate_drive "IFS_PROD"                          "0AF3_kuuCB-k7Uk9PVA"
migrate_drive "IMAGENS_CAMERAS"                   "0ACg91Y742lKPUk9PVA"
migrate_drive "INDICADORES_POWER_BI"              "0AC2X48Ew1CIRUk9PVA"
migrate_drive "INDUSTRIAL"                        "0AFwSL48iDII6Uk9PVA"
migrate_drive "LOGISTICA"                         "0ALeD10WqsfdaUk9PVA"
migrate_drive "MALA_DIRETA_BD_IFS"               "0AJlEUSvuIwPQUk9PVA"
migrate_drive "MANUTENCAO"                        "0AMV9LFkQp94jUk9PVA"
migrate_drive "MARKETING"                         "0AKjqL2jAceRBUk9PVA"
migrate_drive "METADADOS"                         "0AKSd1rElNyFTUk9PVA"
migrate_drive "NOTIFIC_RJ"                        "0AOfS48Tp24X0Uk9PVA"
migrate_drive "PCP_COMPRAS"                       "0AAmXchnohSnQUk9PVA"
migrate_drive "PLANILHAS_COLABORATIVAS"           "0AMmiGErLuQ4-Uk9PVA"
migrate_drive "POWERBI_DADOS"                     "0AGVAZ0eEvIajUk9PVA"
migrate_drive "PRODUCAO"                          "0AKF0mj45HdkDUk9PVA"
migrate_drive "PUBLICO_GDRV"                      "0ABKMx1h2qdm2Uk9PVA"
migrate_drive "RECURSOS_HUMANOS"                  "0ADoXXTQ6uFDoUk9PVA"
migrate_drive "REGULATORIO"                       "0APJ07weXFn8LUk9PVA"
migrate_drive "RENOVACAO_LICENCA_AMBIENTAL_2026"  "0AMfuiC2IZC0GUk9PVA"
migrate_drive "SECRETARIA_EXECUTIVA"              "0AF1LDR7B9kZdUk9PVA"
migrate_drive "SEGURANCA_DO_TRABALHO"             "0ABk8vA9JLkZ_Uk9PVA"
migrate_drive "VALIDACAO"                         "0AEb73Y8fwXFmUk9PVA"
migrate_drive "VENDAS"                            "0ABRWCXJbkEVDUk9PVA"

log "====== MIGRAÇÃO CONCLUÍDA ======"
df -h "$DEST_BASE" | tee -a "$LOG"
