# 10 — Migração Google Drive `[TEMPORÁRIO]`

> **Este módulo descreve um processo temporário em andamento.**
> Será removido do Blueprint após a conclusão da migração.
> **Não incluir no POP.**

**Última atualização:** 2026-04-13

---

## 10.1 Objetivo

Migrar o conteúdo de todos os Shared Drives do Google Drive da empresa para o servidor local (`/mnt/hdd3/gdrive_import/`), como parte da estratégia de consolidação do armazenamento no LABSRVFILES.

## 10.2 Estado Atual

- **Drives a migrar:** 43 Shared Drives
- **Destino:** `/mnt/hdd3/gdrive_import/` (disco sdd — 465GB)
- **Status:** em andamento (iniciado em abril de 2026)
- **PID ativo:** monitorado pelo watchdog

## 10.3 Ferramentas

| Ferramenta | Versão | Função |
|---|---|---|
| rclone | 1.73.4 | Cópia dos Shared Drives para o servidor |
| migrate-gdrive-all.sh | — | Script orquestrador da migração |
| migrate-watchdog.sh | — | Watchdog com reinício automático em caso de travamento |

## 10.4 Scripts

**Migração:** `scripts/migrate-gdrive-all.sh`
- Itera pelos 43 drives em sequência
- Retomável: pula drives já marcados como `CONCLUÍDO` no log
- Flags: `--tpslimit 2`, `--drive-pacer-min-sleep 200ms`, `--stats 30s`

**Watchdog:** `scripts/migrate-watchdog.sh`
- Executa via cron a cada 15 minutos
- Reinicia a migração se o log ficar sem atualização por 60 minutos
- Registra as últimas 20 linhas do log de migração antes de reiniciar

## 10.5 Logs e Monitoramento

```bash
# Progresso da migração
tail -f ~/migrate-gdrive.log

# Log do watchdog
tail -f /var/log/migrate-watchdog.log

# Processo ativo
pgrep -a -f migrate-gdrive-all.sh
```

## 10.6 Problemas Conhecidos

| Problema | Causa | Mitigação |
|---|---|---|
| Travamentos periódicos | `rateLimitExceeded` da API Google | Watchdog reinicia automaticamente; `--tpslimit 2` reduz pressão |
| Arquivo corrompido | Arquivo aberto no Drive durante upload original | `--ignore-errors` pula e continua |
