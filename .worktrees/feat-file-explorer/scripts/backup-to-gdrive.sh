#!/bin/bash
# backup-to-gdrive.sh — backup incremental do servidor para o Google Drive
#
# Fluxo pós-cutover: servidor é a fonte primária, GDrive vira backup offsite.
# Usa rclone sync (local → GDrive): novos arquivos são enviados, deletados são
# removidos do GDrive, modificados são atualizados.
#
# ⚠️  ATENÇÃO ANTES DE ATIVAR:
#   1. Confirmar que SOURCE_* aponta para os paths onde os usuários trabalham
#      (após cutover pode ser /srv/samba/SHARE ou ainda gdrive_import/DRIVE —
#      depende de como o cutover for executado).
#   2. Testar com --dry-run antes da primeira execução real.
#   3. O rclone sync DELETA do GDrive o que não existir mais no servidor.
#      Revisar política de retenção antes de ativar.
#
# Uso manual:   bash ~/labsrvfiles/scripts/backup-to-gdrive.sh
# Uso dry-run:  DRY_RUN=1 bash ~/labsrvfiles/scripts/backup-to-gdrive.sh
# Cron sugerido (23h diário, após cutover):
#   0 23 * * * admin bash /home/admin/labsrvfiles/scripts/backup-to-gdrive.sh
#
# Log: ~/backup-to-gdrive.log

# ── Fontes locais (ajustar após cutover se paths mudarem) ─────────────────────
SSD="/srv/samba/gdrive_import"
HDD="/mnt/hdd/gdrive_import"
HDD3="/mnt/hdd3/gdrive_import"
EXTERNO="/mnt/externo/gdrive_import"

REMOTE="gdrive-labsobral"
LOG="$HOME/backup-to-gdrive.log"
TRANSFERS=8
CHECKERS=16
TPSLIMIT=8          # conservador — GDrive tem quota de API
PACER_SLEEP=10ms
DISK_MINIMO_GB=5    # aborta se disco de origem tiver menos que isso

DRY_RUN="${DRY_RUN:-0}"

PID_FILE="/tmp/labsrv-backup-gdrive.pid"
LOCK_FILE="/tmp/labsrv-backup-gdrive.lock"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] AVISO: backup-to-gdrive já está rodando (PID $(cat $PID_FILE 2>/dev/null)). Saindo." >&2
    exit 1
fi
echo $$ > "$PID_FILE"
trap "rm -f '$PID_FILE' '$LOCK_FILE'; flock -u 9" EXIT

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

check_disk() {
    local source_base="$1"
    local livre_kb livre_gb
    livre_kb=$(df "$source_base" | awk 'NR==2 {print $4}')
    livre_gb=$(( livre_kb / 1024 / 1024 ))
    if [ "$livre_gb" -lt "$DISK_MINIMO_GB" ]; then
        log "ALERTA: disco de origem com apenas ${livre_gb} GB livres em $source_base — abortando."
        exit 1
    fi
}

ja_feito_hoje() {
    local name="$1"
    local hoje
    hoje=$(date '+%Y-%m-%d')
    grep -q "\[${hoje}.*\] <<< BACKUP-OK: ${name}$" "$LOG" 2>/dev/null
}

backup_drive() {
    local name="$1" id="$2" source_base="$3"
    local source="$source_base/$name"

    if [ ! -d "$source" ]; then
        log ">>> PULANDO (diretório não encontrado): $name — $source"
        return 0
    fi

    if ja_feito_hoje "$name"; then
        log ">>> PULANDO (já feito hoje): $name"
        return 0
    fi

    check_disk "$source_base"

    local dry_flag=""
    [ "$DRY_RUN" = "1" ] && dry_flag="--dry-run"

    log ">>> BACKUP: $name → GDrive (ID: $id) ${dry_flag:+[DRY-RUN]}"

    rclone sync \
        "$source" \
        "${REMOTE},team_drive=${id},root_folder_id=${id}:" \
        --transfers "$TRANSFERS" \
        --checkers "$CHECKERS" \
        --tpslimit "$TPSLIMIT" \
        --drive-pacer-min-sleep "$PACER_SLEEP" \
        --drive-acknowledge-abuse \
        --drive-skip-dangling-shortcuts \
        --ignore-errors \
        --fast-list \
        --stats-one-line \
        --stats 60s \
        --log-level INFO \
        $dry_flag \
        >> "$LOG" 2>&1

    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        log "<<< BACKUP-OK: $name"
    else
        log "<<< BACKUP-ERRO (código $exit_code): $name"
    fi
    echo "---" >> "$LOG"
}

log "====== INÍCIO DO BACKUP → GDRIVE ======"
[ "$DRY_RUN" = "1" ] && log "*** MODO DRY-RUN — nenhum arquivo será alterado ***"
log "SSD: $SSD | HDD: $HDD | HDD3: $HDD3 | EXTERNO: $EXTERNO"
df -h "$SSD" "$HDD" "$HDD3" "$EXTERNO" >> "$LOG" 2>&1

# ── SSD → GDrive ──────────────────────────────────────────────────────────────
backup_drive "AMOSTRAGEM"                        "0AM9bA0jR3khtUk9PVA"  "$SSD"
backup_drive "ASSUNTOS_REGULATORIOS"             "0AE-lgz70ZL46Uk9PVA"  "$SSD"
backup_drive "COMERCIAL"                         "0AFt0ygoC_2HdUk9PVA"  "$SSD"
backup_drive "CONTABILIDADE"                     "0AGfUCI5zcIR1Uk9PVA"  "$SSD"
backup_drive "CONTROLE_files_research_PART1"     "0AJww3cOaaLm9Uk9PVA"  "$SSD"
backup_drive "CONTROLE_files_research_PART2"     "0ADE_pSEELO0qUk9PVA"  "$SSD"
backup_drive "CONTROLE_DA_QUALIDADE"             "0AEG4w39-I9FLUk9PVA"  "$SSD"
backup_drive "CQ_CONSULTAS_ATE_2019"             "0AJGIPDx_MSMgUk9PVA"  "$SSD"
backup_drive "DEPTO_PESSOAL"                     "0AFCNkPHfJ5QqUk9PVA"  "$SSD"
backup_drive "DEPTO_TECNICO"                     "0AIt4fV4pGGziUk9PVA"  "$SSD"
backup_drive "DRE_PROJETADO"                     "0AGwktq4lQzxaUk9PVA"  "$SSD"
backup_drive "FARMACOPEIAS"                      "0AM0G5iluQtNSUk9PVA"  "$SSD"
backup_drive "FARMACOVIGILANCIA"                 "0ANRdJ8RFUjSVUk9PVA"  "$SSD"
backup_drive "FINANCEIRO"                        "0AKf3PglVP3CEUk9PVA"  "$SSD"
backup_drive "GARANTIA"                          "0AC0UFgfLUGrtUk9PVA"  "$SSD"
backup_drive "IFS_HMLG"                          "0AC9ollY_anZ7Uk9PVA"  "$SSD"
backup_drive "IFS_PROD"                          "0AF3_kuuCB-k7Uk9PVA"  "$SSD"

# ── HDD3 → GDrive ─────────────────────────────────────────────────────────────
backup_drive "INDUSTRIAL"                        "0AFwSL48iDII6Uk9PVA"  "$HDD3"
backup_drive "LOGISTICA"                         "0ALeD10WqsfdaUk9PVA"  "$HDD3"
backup_drive "MANUTENCAO"                        "0AMV9LFkQp94jUk9PVA"  "$HDD3"
backup_drive "METADADOS"                         "0AKSd1rElNyFTUk9PVA"  "$HDD3"
backup_drive "NOTIFIC_RJ"                        "0AOfS48Tp24X0Uk9PVA"  "$HDD3"
backup_drive "PCP_COMPRAS"                       "0AAmXchnohSnQUk9PVA"  "$HDD3"
backup_drive "PLANILHAS_COLABORATIVAS"           "0AMmiGErLuQ4-Uk9PVA"  "$HDD3"
backup_drive "PRODUCAO"                          "0AKF0mj45HdkDUk9PVA"  "$HDD3"
backup_drive "RECURSOS_HUMANOS"                  "0ADoXXTQ6uFDoUk9PVA"  "$HDD3"
backup_drive "REGULATORIO"                       "0APJ07weXFn8LUk9PVA"  "$HDD3"
backup_drive "RENOVACAO_LICENCA_AMBIENTAL_2026"  "0AMfuiC2IZC0GUk9PVA"  "$HDD3"
backup_drive "VALIDACAO"                         "0AEb73Y8fwXFmUk9PVA"  "$HDD3"

# ── HDD → GDrive ──────────────────────────────────────────────────────────────
backup_drive "VENDAS"                            "0ABRWCXJbkEVDUk9PVA"  "$HDD"
backup_drive "ARQUIVOS_GERADORES"                "0AHJWbgsDRqDvUk9PVA"  "$HDD"
backup_drive "BOOK_DE_INDICADORES"               "0AA_reRHJqZhiUk9PVA"  "$HDD"
backup_drive "DIRETORIA_ADMIN_FINANCEIRA"        "0AFMm7LaZsr9EUk9PVA"  "$HDD"
backup_drive "DIRETORIA_TECNICA"                 "0AFSqFzKTnz0TUk9PVA"  "$HDD"
backup_drive "ENDOMARKETING"                     "0ADEuJJ-Uk_KeUk9PVA"  "$HDD"
backup_drive "IMAGENS_CAMERAS"                   "0ACg91Y742lKPUk9PVA"  "$HDD"
backup_drive "INDICADORES_POWER_BI"              "0AC2X48Ew1CIRUk9PVA"  "$HDD"
backup_drive "MALA_DIRETA_BD_IFS"                "0AJlEUSvuIwPQUk9PVA"  "$HDD"
backup_drive "POWERBI_DADOS"                     "0AGVAZ0eEvIajUk9PVA"  "$HDD"
backup_drive "SECRETARIA_EXECUTIVA"              "0AF1LDR7B9kZdUk9PVA"  "$HDD"
backup_drive "SEGURANCA_DO_TRABALHO"             "0ABk8vA9JLkZ_Uk9PVA"  "$HDD"

# ── EXTERNO → GDrive ──────────────────────────────────────────────────────────
backup_drive "MARKETING"                         "0AKjqL2jAceRBUk9PVA"  "$EXTERNO"

log "====== BACKUP → GDRIVE CONCLUÍDO ======"
df -h "$SSD" "$HDD" "$HDD3" "$EXTERNO" >> "$LOG" 2>&1
