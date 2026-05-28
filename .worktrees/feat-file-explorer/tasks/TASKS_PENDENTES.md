# TASKS PENDENTES — LABSRVFILES

> Atualizado em: 2026-04-19
> Servidor: Ubuntu Server 22.04 | Samba 4.x | AD integrado

---

## 🔴 Alta Prioridade

- [ ] **Delta-sync — capturar modificações feitas durante a migração bruta**
  - Rodar `delta-sync.sh` para sincronizar alterações feitas no Google Drive durante a janela de migração
  - Script corrigido em 2026-04-19 (estava com DEST_BASE fixo em HDD3 — agora mapeado por disco correto)
  - Comando: `nohup bash ~/labsrvfiles/scripts/delta-sync.sh > /dev/null 2>&1 &`
  - Monitorar: `tail -f ~/delta-sync-gdrive.log`

- [ ] **Cutover gradual por departamento — validação antes de desligar GDrive**
  - Estratégia: cada depto é avisado → testa acesso via `\\192.86.221.213\[SHARE]` → confirma OK → só então é desconectado do Google Drive
  - Validar que diretórios existem e têm permissões corretas (ver `docs/status-shares-discos.md`)
  - Testar acesso via Windows share por share antes de avisar cada depto
  - Google Drive permanece ativo por depto até validação concluída

- [ ] **feat: Google Drive como destino de backup incremental (pós-cutover)**
  - Após validação de todos os shares no servidor, inverter o fluxo: servidor → GDrive
  - Criar `scripts/backup-to-gdrive.sh` usando `rclone sync` de cada share Samba para o Drive Compartilhado correspondente
  - GDrive passa a ser backup offsite (substitui o papel do HDD2 local, que não é offsite real)
  - Agendar via cron diário (noturno) após cutover completo
  - Drives Compartilhados já existem no GDrive (mesmos IDs da migração) — reutilizar remote `gdrive-labsobral`

---

## 🟡 Média Prioridade

- [ ] **Configurar autenticação SSH por chave para GitHub**
  - Gerar chave no servidor: `ssh-keygen -t ed25519 -C "labsrvfiles"`
  - Adicionar chave pública ao repositório GitHub (Deploy Key)
  - Alterar remote: `git remote set-url origin git@github.com:paulinete1508-dev/labsrvfiles.git`

- [ ] **Aplicar e validar regras UFW**
  - Executar `sudo bash ufw-rules.sh`
  - Confirmar SSH (22) e SMB (445/139) acessíveis apenas na rede interna

- [ ] **Verificar integração AD pós-configuração**
  - Testar: `id usuario@DOMINIO`
  - Validar listagem de grupos: `getent group`

---

## 🟢 Baixa Prioridade

- [ ] **Reativar e redesenhar estratégia de backup — pós-migração**
  - Backup local no HDD2 desabilitado em 2026-04-17 (cron zerado em `/etc/cron.d/backup-labsrv`)
  - Motivo: sem valor durante migração + backup no próprio servidor não é offsite real
  - Dados seguros no Google Drive (origem da migração) enquanto migração não conclui
  - Pós-migração: avaliar backup offsite real (Google Drive via rclone, segundo servidor, etc.)
  - Para reativar: `sudo bash -c 'echo "0 23 * * * root /usr/local/bin/backup-labsrv.sh" > /etc/cron.d/backup-labsrv'`



- [ ] **Configurar monitoramento básico**
  - Verificar se `fail2ban` está ativo para SSH
  - Avaliar `logwatch` ou similar para relatórios diários

- [ ] **Documentar procedimento de recuperação**
  - Criar `docs/recuperacao-desastre.md`
  - Incluir passos para restaurar Samba, SSSD e rclone do zero

- [ ] **Criar checklist de manutenção mensal**
  - Verificar logs de erro do Samba
  - Confirmar execução dos backups
  - Atualizar pacotes: `sudo apt update && sudo apt upgrade`

---

## 🔵 Migração Google Drive — Status

**Migração bruta CONCLUÍDA em 2026-04-17**

| Drive | Destino | Status |
|---|---|---|
| AMOSTRAGEM | SSD | ✅ Concluído |
| ASSUNTOS_REGULATORIOS | SSD | ✅ Concluído |
| COMERCIAL | SSD | ✅ Concluído |
| CONTABILIDADE | SSD | ✅ Concluído |
| CONTROLE_files_research_PART1 | SSD | ✅ Concluído (237 GB) |
| CONTROLE_files_research_PART2 | SSD | ✅ Concluído |
| CONTROLE_DA_QUALIDADE | SSD | ✅ Concluído |
| CQ_CONSULTAS_ATE_2019 | SSD | ✅ Concluído |
| DEPTO_PESSOAL | SSD | ✅ Concluído |
| DEPTO_TECNICO | SSD | ✅ Concluído |
| DRE_PROJETADO | SSD | ✅ Concluído |
| FARMACOPEIAS | SSD | ✅ Concluído |
| FARMACOVIGILANCIA | SSD | ✅ Concluído |
| FINANCEIRO | SSD | ✅ Concluído |
| GARANTIA | SSD | ✅ Concluído |
| IFS_HMLG | SSD | ✅ Concluído |
| IFS_PROD | SSD | ✅ Concluído |
| INDUSTRIAL | HDD3 | ✅ Concluído |
| LOGISTICA | HDD3 | ✅ Concluído |
| MANUTENCAO | HDD3 | ✅ Concluído |
| METADADOS | HDD3 | ✅ Concluído |
| NOTIFIC_RJ | HDD3 | ✅ Concluído |
| PCP_COMPRAS | HDD3 | ✅ Concluído |
| PLANILHAS_COLABORATIVAS | HDD3 | ✅ Concluído |
| PRODUCAO | HDD3 | ✅ Concluído |
| RECURSOS_HUMANOS | HDD3 | ✅ Concluído |
| REGULATORIO | HDD3 | ✅ Concluído |
| RENOVACAO_LICENCA_AMBIENTAL_2026 | HDD3 | ✅ Concluído |
| VALIDACAO | HDD3 | ✅ Concluído |
| VENDAS | HDD | ✅ Concluído |
| ARQUIVOS_GERADORES | HDD | ✅ Concluído |
| BOOK_DE_INDICADORES | HDD | ✅ Concluído |
| DIRETORIA_ADMIN_FINANCEIRA | HDD | ✅ Concluído |
| DIRETORIA_TECNICA | HDD | ✅ Concluído |
| ENDOMARKETING | HDD | ✅ Concluído |
| IMAGENS_CAMERAS | HDD | ✅ Concluído |
| INDICADORES_POWER_BI | HDD | ✅ Concluído |
| MALA_DIRETA_BD_IFS | HDD | ✅ Concluído |
| POWERBI_DADOS | HDD | ✅ Concluído |
| SECRETARIA_EXECUTIVA | HDD | ✅ Concluído |
| SEGURANCA_DO_TRABALHO | HDD | ✅ Concluído |
| MARKETING | EXTERNO | ✅ Concluído |
| PUBLICO_GDRV | — | ⛔ Descartado (drive público sem valor operacional) |

**Total: 42/42 migrados · PUBLICO_GDRV descartado intencionalmente**

**Próximo passo:** rodar `delta-sync.sh` → cutover → comunicar usuários

**Monitorar via painel:** `http://192.86.221.213:8080` → Migração Google Drive

---

## ✅ Concluído

- [x] Instalar e configurar Git no servidor (2026-04-10)
- [x] Inicializar repositório `labsrvfiles` localmente (2026-04-10)
- [x] Criar estrutura de pastas: `config/`, `scripts/`, `docs/`, `tasks/` (2026-04-10)
- [x] Instalar framework **agnostic-core** como git submodule em `.agnostic-core/` (2026-04-12)
- [x] Construir painel de administração web (FastAPI + HTML/CSS/JS) (2026-04-12)
  - Auth PAM + JWT, roles, dashboard, discos, shares, usuários, migração, terminal
- [x] Configurar deploy do painel em `/opt/labsrv-panel` via systemd (2026-04-13)
- [x] Exibir 4 discos no painel de migração: SSD + HDD + HDD3 + EXTERNO (2026-04-16)
- [x] Detecção automática de discos via `findmnt` — remove DISK_MOUNTS hardcoded (2026-04-15)
- [x] Habilitar MARKETING no HD externo Toshiba 916 GB (2026-04-15)
- [x] Adicionar agente `project-onboarding` em `.claude/agents/` (2026-04-16)
- [x] Criar `scripts/check-sizes.sh` — audita tamanhos dos drives pendentes no GDrive (2026-04-16)
- [x] Migração bruta Google Drive concluída — 42 drives migrados (2026-04-17)
- [x] CONTROLE_files_research_PART1 concluído com sucesso — 237 GB no SSD (2026-04-17)
- [x] PUBLICO_GDRV descartado intencionalmente (drive público sem valor operacional) (2026-04-17)
