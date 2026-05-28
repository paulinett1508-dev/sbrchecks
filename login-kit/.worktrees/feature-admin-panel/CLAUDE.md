# CLAUDE.md — LABSRVFILES
> Arquivo de contexto para Claude Code. Leia este arquivo integralmente antes de qualquer ação.

---

## 1. IDENTIDADE DO PROJETO

Este repositório gerencia a infraestrutura completa do **servidor de arquivos interno do Laboratório Sobral**.

- **Hostname:** LABSRVFILES
- **IP:** 192.86.221.213
- **OS:** Ubuntu Server 22.04.5 LTS
- **Domínio AD:** labsobralnet.ind
- **Responsável TI:** admin@192.86.221.213

---

## 2. LEITURA OBRIGATÓRIA ANTES DE AGIR

Antes de qualquer tarefa, leia na seguinte ordem:

1. Este arquivo (`CLAUDE.md`)
2. `tasks/TASKS_PENDENTES.md` — estado atual, pendências e features planejadas
3. `docs/Blueprint_Tecnico.md` — arquitetura completa
4. O arquivo de config relevante para a tarefa em `config/`

Se estiver conectado ao repo **agnostic-core**, leia:
- Qualquer skill com tag `infrastructure`, `linux`, `samba`, `backup`, `networking` ou `security`
- Skills de automação bash/shell
- Skills de documentação técnica

---

## 3. ARQUITETURA RESUMIDA

```
STORAGE
├── sdb (SSD 953GB) → / + /srv/samba        # 12 deptos críticos
├── sdc (HDD 465GB) → /mnt/hdd/samba        # 6 deptos secundários
├── sda (HDD 465GB) → /mnt/hdd2/backups     # Backup incremental diário
└── sdd (HDD 465GB) → /mnt/hdd3             # Snapshot semanal / reserva

SERVIÇOS
├── Samba 4.x        → compartilhamentos SMB (19 shares)
├── SSSD             → autenticação via Active Directory
├── UFW              → firewall host (portas 22/445/139 apenas rede interna)
├── rclone v1.73.4   → backup Google Drive (BACKUP_SERVIDOR shared drive)
└── rsync            → backup incremental local diário (cron 23h)

REDE
├── pfSense          → firewall perímetro (camada externa)
├── AD               → 192.86.221.218 / Windows Server 2012
└── DNS              → 192.86.221.218 (AD) + 8.8.8.8 (fallback)
```

---

## 4. COMPARTILHAMENTOS SAMBA

| Share | Caminho | Grupo AD |
|---|---|---|
| DEPARTAMENTO_TECNICO | /srv/samba/DEPARTAMENTO_TECNICO | LABSOBRALNET\SISTEMA DA QUALIDADE |
| CONTABILIDADE | /srv/samba/CONTABILIDADE | LABSOBRALNET\CONTABILIDADE |
| FISCAL | /srv/samba/FISCAL | LABSOBRALNET\CONTABILIDADE |
| CONTROLADORIA | /srv/samba/CONTROLADORIA | LABSOBRALNET\CONTROLADORIA |
| FINANCEIRO | /srv/samba/FINANCEIRO | LABSOBRALNET\FINANCEIRO |
| RECURSOS_HUMANOS | /srv/samba/RECURSOS_HUMANOS | LABSOBRALNET\RECURSOS HUMANOS |
| COMERCIAL_VENDAS | /srv/samba/COMERCIAL_VENDAS | usuários locais (comercial1/2/3) |
| INDUSTRIAL | /srv/samba/INDUSTRIAL | LABSOBRALNET\INDUSTRIAL |
| SUPRIMENTOS | /srv/samba/SUPRIMENTOS | LABSOBRALNET\PCP |
| MANUTENCAO | /srv/samba/MANUTENCAO | LABSOBRALNET\MANUTENÇÃO |
| LOGISTICA_RECEBIMENTO | /srv/samba/LOGISTICA_RECEBIMENTO | LABSOBRALNET\LOGISTICA |
| LOGISTICA_EXPEDICAO | /srv/samba/LOGISTICA_EXPEDICAO | LABSOBRALNET\LOGISTICA |
| MARKETING | /mnt/hdd/samba/MARKETING | LABSOBRALNET\MARKETING |
| SEGURANCA_TRABALHO | /mnt/hdd/samba/SEGURANCA_TRABALHO | LABSOBRALNET\SESMT |
| SERVICOS_GERAIS | /mnt/hdd/samba/SERVICOS_GERAIS | LABSOBRALNET\SERVICOS GERAIS |
| DIRETORIAS | /mnt/hdd/samba/DIRETORIAS | LABSOBRALNET\PRESIDENCIA |
| SECRETARIA | /mnt/hdd/samba/SECRETARIA | LABSOBRALNET\SECRETARIA |
| TI | /mnt/hdd/samba/TI | LABSOBRALNET\Administradores |
| LINKS_UTEIS | /mnt/hdd/samba/MARKETING/LINKS_UTEIS | usuário local (vendedores) |

---

## 5. REGRAS DE OPERAÇÃO

### Sempre fazer antes de editar configs:
```bash
# Backup do config atual
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.bak.$(date +%Y%m%d)
```

### Após editar smb.conf:
```bash
testparm -s                        # validar sintaxe
sudo systemctl restart smbd        # aplicar mudanças
sudo systemctl status smbd         # confirmar status
```

### Após editar sssd.conf:
```bash
sudo chmod 600 /etc/sssd/sssd.conf
sudo systemctl restart sssd
sudo systemctl status sssd
```

### Testar acesso de usuário AD:
```bash
id usuario@labsobralnet.ind
```

### Verificar backup:
```bash
cat /var/log/backup-labsrv.log | tail -30
```

### Verificar discos:
```bash
df -h | grep -E '/$|/mnt/'
```

---

## 6. CONVENÇÕES DO PROJETO

- **Usernames locais:** formato `primeiro.sobrenome` (ex: joao.silva)
- **Grupos Linux locais:** nome curto em minúsculo (ex: manutencao, rh, logistica)
- **Grupos AD:** nome exato conforme AD (ex: LABSOBRALNET\MANUTENÇÃO)
- **Commits:** usar prefixos `feat:`, `fix:`, `config:`, `docs:`, `infra:`
- **Nunca commitar senhas** — usar variáveis de ambiente ou vault

---

## 7. TAREFAS ATIVAS

Consulte sempre `tasks/TASKS_PENDENTES.md` para o estado atual.
Tarefas em andamento devem ser marcadas com `[WIP]`.
Tarefas concluídas devem ser movidas para a seção `CONCLUÍDO`.

---

## 8. CONTATOS E ACESSOS

| Recurso | Detalhe |
|---|---|
| SSH | admin@192.86.221.213 porta 22 |
| Google Drive Backup | suporte@laboratoriosobral.com |
| AD Admin | administrador@labsobralnet.ind |
| rclone remote | gdrive-labsobral → BACKUP_SERVIDOR |

> ⚠️ Nunca commitar senhas, hashes ou tokens neste repositório.
> ⚠️ Repositório PRIVADO — não tornar público.
