# 2 — Hardware e Storage
**Última atualização:** 2026-04-13

---

## 2.1 Discos

| Dispositivo | Tipo | Capacidade | Mount Point | Uso |
|---|---|---|---|---|
| sdb | SSD | 953 GB | `/` e `/srv/samba` | OS + compartilhamentos críticos (12 deptos) |
| sdc | HDD | 465 GB | `/mnt/hdd/samba` | Compartilhamentos secundários (6 deptos) |
| sda | HDD | 465 GB | `/mnt/hdd2/backups` | Backup incremental diário (rsync) |
| sdd | HDD | 465 GB | `/mnt/hdd3` | Snapshot semanal / reserva / importação |

**Capacidade total:** ~2,3 TB
**Capacidade em produção (shares):** ~1,4 TB
**Capacidade de backup local:** ~465 GB

## 2.2 Layout de Partições

```
sdb (SSD 953GB)
├── /             → sistema operacional Ubuntu
└── /srv/samba    → 12 compartilhamentos (deptos críticos)

sdc (HDD 465GB)
└── /mnt/hdd      → 6 compartilhamentos (deptos secundários)
    └── /mnt/hdd/samba/

sda (HDD 465GB)
└── /mnt/hdd2
    └── /mnt/hdd2/backups/  → destino do rsync diário

sdd (HDD 465GB)
└── /mnt/hdd3               → snapshots / reserva
```

## 2.3 Verificação de Saúde dos Discos

```bash
# Uso atual
df -h | grep -E '/$|/mnt/'

# Status S.M.A.R.T (requer smartmontools)
sudo smartctl -a /dev/sdb
sudo smartctl -a /dev/sdc
sudo smartctl -a /dev/sda
sudo smartctl -a /dev/sdd

# I/O em tempo real
iostat -x 1 3
```
