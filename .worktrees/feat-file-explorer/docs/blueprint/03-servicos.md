# 3 — Serviços e Processos
**Última atualização:** 2026-04-13

---

## 3.1 Samba 4.x

| Campo | Detalhe |
|---|---|
| **Função** | Compartilhamento de arquivos via SMB para clientes Windows |
| **Versão** | Samba 4.x |
| **Configuração** | `/etc/samba/smb.conf` (versionado em `config/smb.conf`) |
| **Unidades systemd** | `smbd` (daemon principal), `nmbd` (resolução de nomes NetBIOS) |
| **Portas** | 445/TCP (SMB), 139/TCP (NetBIOS) |
| **Compartilhamentos** | 19 shares (ver módulo 04) |

```bash
sudo systemctl status smbd nmbd
testparm -s              # validar configuração
```

## 3.2 SSSD (System Security Services Daemon)

| Campo | Detalhe |
|---|---|
| **Função** | Autenticação de usuários do AD no servidor Linux |
| **Configuração** | `/etc/sssd/sssd.conf` (permissão 600 obrigatória) |
| **Domínio** | labsobralnet.ind |
| **AD Server** | 192.86.221.218 (Windows Server 2012) |
| **Unidade systemd** | `sssd` |

```bash
sudo systemctl status sssd
id usuario@labsobralnet.ind   # testar autenticação AD
```

## 3.3 UFW (Uncomplicated Firewall)

| Campo | Detalhe |
|---|---|
| **Função** | Firewall host — controle de acesso por porta/IP |
| **Configuração** | `ufw-rules.sh` (versionado) |
| **Portas liberadas** | 22, 139, 445, 8080 — apenas 192.86.221.0/24 |

```bash
sudo ufw status verbose
```

## 3.4 rsync

| Campo | Detalhe |
|---|---|
| **Função** | Backup incremental local diário |
| **Script** | `scripts/backup-labsrv.sh` |
| **Agendamento** | Cron: todo dia às 23h00 |
| **Origem** | `/srv/samba/`, `/mnt/hdd/samba/` |
| **Destino** | `/mnt/hdd2/backups/` |
| **Log** | `/var/log/backup-labsrv.log` |

## 3.5 rclone

| Campo | Detalhe |
|---|---|
| **Versão** | 1.73.4 |
| **Função** | Backup/migração para Google Drive |
| **Remote** | `gdrive-labsobral` → Shared Drive `BACKUP_SERVIDOR` |
| **Conta** | suporte@laboratoriosobral.com |
| **Log** | `/var/log/rclone-backup.log` |

## 3.6 labsrv-panel (Painel Web)

| Campo | Detalhe |
|---|---|
| **Função** | Interface web de administração |
| **Stack** | Python 3.10 + FastAPI + HTML/CSS/JS puro |
| **Porta** | 8080 |
| **Unidade systemd** | `labsrv-panel` |
| **Código-fonte** | `panel/` (no repositório) |

```bash
sudo systemctl status labsrv-panel
```

## 3.7 Tarefas Agendadas (cron)

```bash
crontab -l   # ver crons do usuário admin
```

| Horário | Tarefa |
|---|---|
| 23h00 diário | Backup rsync local |
| */15 * * * * | Watchdog de migração GDrive (temporário) |
