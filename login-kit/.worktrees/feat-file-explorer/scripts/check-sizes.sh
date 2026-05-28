#!/bin/bash
# Verifica tamanhos dos drives pendentes no Google Drive
REMOTE="gdrive-labsobral"
LOG="/tmp/drive-sizes.log"
> "$LOG"

check() {
    local name="$1" id="$2" dest="$3"
    local result
    result=$(rclone size "${REMOTE},team_drive=${id},root_folder_id=${id}:" \
        --fast-list 2>/dev/null | grep 'Total size')
    echo "$dest | $name | $result" | tee -a "$LOG"
}

echo '=== SSD pendentes ===' | tee -a "$LOG"
check FARMACOVIGILANCIA                0ANRdJ8RFUjSVUk9PVA SSD
check FINANCEIRO                       0AKf3PglVP3CEUk9PVA SSD
check GARANTIA                         0AC0UFgfLUGrtUk9PVA SSD
check IFS_HMLG                         0AC9ollY_anZ7Uk9PVA SSD
check IFS_PROD                         0AF3_kuuCB-k7Uk9PVA SSD
check INDUSTRIAL                       0AFwSL48iDII6Uk9PVA SSD
check LOGISTICA                        0ALeD10WqsfdaUk9PVA SSD
check MANUTENCAO                       0AMV9LFkQp94jUk9PVA SSD
check METADADOS                        0AKSd1rElNyFTUk9PVA SSD
check NOTIFIC_RJ                       0AOfS48Tp24X0Uk9PVA SSD
check PCP_COMPRAS                      0AAmXchnohSnQUk9PVA SSD
check PLANILHAS_COLABORATIVAS          0AMmiGErLuQ4-Uk9PVA SSD
check PRODUCAO                         0AKF0mj45HdkDUk9PVA SSD
check RECURSOS_HUMANOS                 0ADoXXTQ6uFDoUk9PVA SSD
check REGULATORIO                      0APJ07weXFn8LUk9PVA SSD
check RENOVACAO_LICENCA_AMBIENTAL_2026 0AMfuiC2IZC0GUk9PVA SSD
check VALIDACAO                        0AEb73Y8fwXFmUk9PVA SSD
check VENDAS                           0ABRWCXJbkEVDUk9PVA SSD

echo '=== HDD pendentes ===' | tee -a "$LOG"
check DIRETORIA_ADMIN_FINANCEIRA       0AFMm7LaZsr9EUk9PVA HDD
check DIRETORIA_TECNICA                0AFSqFzKTnz0TUk9PVA HDD
check ENDOMARKETING                    0ADEuJJ-Uk_KeUk9PVA HDD
check IMAGENS_CAMERAS                  0ACg91Y742lKPUk9PVA HDD
check INDICADORES_POWER_BI             0AC2X48Ew1CIRUk9PVA HDD
check MALA_DIRETA_BD_IFS              0AJlEUSvuIwPQUk9PVA HDD
check MARKETING                        0AKjqL2jAceRBUk9PVA HDD
check POWERBI_DADOS                    0AGVAZ0eEvIajUk9PVA HDD
check PUBLICO_GDRV                     0ABKMx1h2qdm2Uk9PVA HDD
check SECRETARIA_EXECUTIVA             0AF1LDR7B9kZdUk9PVA HDD
check SEGURANCA_DO_TRABALHO            0ABk8vA9JLkZ_Uk9PVA HDD

echo '=== CONCLUIDO ===' | tee -a "$LOG"
