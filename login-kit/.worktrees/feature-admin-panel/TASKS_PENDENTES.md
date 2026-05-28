# TASKS PENDENTES — LABSRVFILES

> Atualizado em: 2026-04-10
> Servidor: Ubuntu Server 22.04 | Samba 4.x | AD integrado

---

## 🔴 Alta Prioridade

- [ ] **Verificar integração AD pós-configuração**
  - Testar autenticação: `id usuario@DOMINIO`
  - Confirmar que GPOs estão sendo aplicadas
  - Validar listagem de grupos: `getent group`

- [ ] **Aplicar e validar regras UFW**
  - Executar `sudo bash ufw-rules.sh`
  - Verificar que SSH (porta 22) permanece acessível
  - Confirmar que clientes SMB conseguem montar compartilhamentos

- [ ] **Copiar configs reais para o repositório**
  ```bash
  sudo cp /etc/samba/smb.conf ~/labsrvfiles/config/smb.conf
  sudo cp /etc/sssd/sssd.conf ~/labsrvfiles/config/sssd.conf
  sudo cp /usr/local/bin/backup-labsrv.sh ~/labsrvfiles/scripts/
  sudo chown -R admin:admin ~/labsrvfiles/config/ ~/labsrvfiles/scripts/
  ```

---

## 🟡 Média Prioridade

- [ ] **Configurar autenticação SSH por chave para GitHub**
  - Gerar chave no servidor: `ssh-keygen -t ed25519 -C "labsrvfiles"`
  - Adicionar chave pública ao repositório GitHub (Deploy Key)
  - Alterar remote para SSH: `git remote set-url origin git@github.com:paulinett1508-dev/labsrvfiles.git`

- [ ] **Agendar backup automático via cron**
  - Validar script `scripts/backup-labsrv.sh`
  - Adicionar ao crontab: `sudo crontab -e`
  - Sugestão: diário às 02:00 — `0 2 * * * /usr/local/bin/backup-labsrv.sh`

- [ ] **Documentar compartilhamentos Samba existentes**
  - Listar com `smbstatus` ou `testparm -s`
  - Adicionar tabela em `docs/compartilhamentos.md`

- [ ] **Revisar permissões dos diretórios compartilhados**
  - Confirmar que grupos AD têm acesso correto
  - Documentar mapeamento grupo AD → pasta → permissão

---

## 🟢 Baixa Prioridade

- [ ] **Configurar monitoramento básico**
  - Verificar se `fail2ban` está ativo para SSH
  - Avaliar uso de `logwatch` ou similar para relatórios diários

- [ ] **Documentar procedimento de recuperação**
  - Criar `docs/recuperacao-desastre.md`
  - Incluir passos para restaurar Samba, SSSD e rclone do zero

- [ ] **Criar checklist de manutenção mensal**
  - Verificar logs de erro do Samba
  - Confirmar execução dos backups
  - Atualizar pacotes: `sudo apt update && sudo apt upgrade`

- [ ] **Configurar alertas de espaço em disco**
  - Script simples com `df -h` + envio por e-mail ou Telegram

---

## ✅ Concluído

- [x] Instalar e configurar Git no servidor (2026-04-10)
- [x] Inicializar repositório `labsrvfiles` localmente (2026-04-10)
- [x] Criar estrutura de pastas: `config/`, `scripts/`, `docs/`, `tasks/` (2026-04-10)
- [x] Criar `README.md`, `CLAUDE.md`, `ufw-rules.sh`, `TASKS_PENDENTES.md` (2026-04-10)
