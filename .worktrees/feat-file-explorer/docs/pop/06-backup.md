# 6 — Backup e Restauração
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 6.1 Objetivo

Garantir a integridade e recuperabilidade dos dados armazenados no servidor de arquivos por meio de rotinas automatizadas de backup.

## 6.2 Rotinas de Backup

### 6.2.1 Backup Incremental Local (diário)

| Campo | Detalhe |
|---|---|
| **Ferramenta** | rsync |
| **Frequência** | Diária às 23h00 (cron) |
| **Origem** | `/srv/samba/` e `/mnt/hdd/samba/` |
| **Destino** | `/mnt/hdd2/backups/` (disco sda — 465GB dedicado) |
| **Tipo** | Incremental — copia apenas arquivos novos ou modificados |
| **Log** | `/var/log/backup-labsrv.log` |

### 6.2.2 Backup em Nuvem (Google Drive)

| Campo | Detalhe |
|---|---|
| **Ferramenta** | rclone v1.73.4 |
| **Remote** | `gdrive-labsobral` → BACKUP_SERVIDOR (Shared Drive) |
| **Conta** | suporte@laboratoriosobral.com |
| **Frequência** | Configurado separadamente (ver crontab) |
| **Log** | `/var/log/rclone-backup.log` |

## 6.3 Verificar Status do Backup

```bash
# Verificar log do backup local
tail -30 /var/log/backup-labsrv.log

# Verificar se backup foi executado hoje
grep "$(date +%Y-%m-%d)" /var/log/backup-labsrv.log | tail -5
```

Ou pelo Painel de Administração → seção **Backup**.

## 6.4 Executar Backup Manual

```bash
sudo bash /home/admin/labsrvfiles/scripts/backup-labsrv.sh
```

## 6.5 Restaurar Arquivo ou Pasta

### 6.5.1 Localizar o arquivo no backup

```bash
# Listar conteúdo do backup
ls /mnt/hdd2/backups/

# Buscar arquivo específico
find /mnt/hdd2/backups/ -name "nome-do-arquivo*"
```

### 6.5.2 Restaurar arquivo individual

```bash
# Restaurar para localização original
sudo cp /mnt/hdd2/backups/srv/samba/DEPARTAMENTO/arquivo.docx \
        /srv/samba/DEPARTAMENTO/arquivo.docx

# Ajustar permissões após restauração
sudo chown root:nome-grupo /srv/samba/DEPARTAMENTO/arquivo.docx
sudo chmod 0660 /srv/samba/DEPARTAMENTO/arquivo.docx
```

### 6.5.3 Restaurar pasta completa

```bash
sudo rsync -av /mnt/hdd2/backups/srv/samba/DEPARTAMENTO/ \
               /srv/samba/DEPARTAMENTO/
```

## 6.6 Registros

Toda restauração deve ser registrada com: data, arquivo/pasta restaurado, solicitante, motivo.
