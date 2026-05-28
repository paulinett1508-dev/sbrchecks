# 7 — Backup e Recuperação
**Última atualização:** 2026-04-13

---

## 7.1 Estratégia

O sistema adota backup em duas camadas:

| Camada | Ferramenta | Frequência | Destino | Retenção |
|---|---|---|---|---|
| Local incremental | rsync | Diária (23h) | /mnt/hdd2/backups (sda) | Contínua (sobrescreve o anterior) |
| Nuvem | rclone | Configurável | Google Drive (BACKUP_SERVIDOR) | Definida pelo Google Drive |

## 7.2 Backup Local (rsync)

**Script:** `scripts/backup-labsrv.sh`

**Cron:** `0 23 * * * /home/admin/labsrvfiles/scripts/backup-labsrv.sh`

**Origem → Destino:**
- `/srv/samba/` → `/mnt/hdd2/backups/srv/samba/`
- `/mnt/hdd/samba/` → `/mnt/hdd2/backups/mnt/hdd/samba/`

**Log:** `/var/log/backup-labsrv.log`

**Flags rsync utilizadas:**
- `--archive` — preserva permissões, timestamps, links simbólicos
- `--delete` — remove do destino arquivos deletados na origem
- `--compress` — comprime durante transferência

## 7.3 Backup em Nuvem (rclone)

**Remote configurado:** `gdrive-labsobral`
**Destino:** Shared Drive `BACKUP_SERVIDOR`
**Conta:** suporte@laboratoriosobral.com
**Config:** `~/.config/rclone/rclone.conf` (não versionado — contém tokens)

```bash
# Verificar remote configurado
rclone listremotes

# Testar conexão
rclone lsd gdrive-labsobral:

# Executar backup manual
rclone sync /srv/samba/ gdrive-labsobral:BACKUP_SERVIDOR/srv/samba/ \
  --progress --log-file=/var/log/rclone-backup.log
```

## 7.4 Recuperação de Dados

### Arquivo individual
```bash
sudo cp /mnt/hdd2/backups/srv/samba/DEPTO/arquivo.ext \
        /srv/samba/DEPTO/arquivo.ext
```

### Pasta completa
```bash
sudo rsync -av /mnt/hdd2/backups/srv/samba/DEPTO/ /srv/samba/DEPTO/
```

### Verificar integridade pós-restauração
```bash
ls -la /srv/samba/DEPTO/
stat /srv/samba/DEPTO/arquivo.ext
```
