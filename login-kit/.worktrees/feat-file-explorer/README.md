# LABSRVFILES

Repositório de configuração e gestão do **Servidor de Arquivos do Laboratório Sobral**.

## Ambiente

| Componente | Versão / Detalhe |
|---|---|
| OS | Ubuntu Server 22.04 LTS |
| Samba | 4.x (Active Directory integrado) |
| Autenticação | SSSD + Winbind (AD) |
| Firewall | UFW |
| Backup | rclone + rsync |
| Repositório | github.com/paulinett1508-dev/labsrvfiles |

## Estrutura do Repositório

```
labsrvfiles/
├── config/
│   ├── smb.conf           # Configuração do Samba
│   └── sssd.conf          # Configuração do SSSD (AD auth)
├── scripts/
│   ├── backup-labsrv.sh       # Backup incremental rsync
│   ├── migrate-gdrive-all.sh  # Migração Google Drive [TEMPORÁRIO]
│   ├── migrate-watchdog.sh    # Watchdog da migração [TEMPORÁRIO]
│   └── delta-sync.sh          # Pré-cutover delta sync
├── panel/                 # Painel de administração web (porta 8080)
│   ├── main.py            # FastAPI entry point
│   ├── api/               # Endpoints REST
│   └── static/            # Frontend HTML/CSS/JS
├── docs/
│   ├── pop/               # POP — 10 módulos
│   ├── blueprint/         # Blueprint Técnico — 10 módulos
│   ├── manual-usuarios/   # Manual de Usuários — 5 módulos
│   ├── POP.md             # Índice do POP
│   ├── Blueprint_Tecnico.md   # Índice do Blueprint
│   └── Manual_de_Uso.md   # Índice do Manual
├── tasks/
│   └── TASKS_PENDENTES.md
├── ufw-rules.sh           # Regras do firewall UFW
├── CLAUDE.md              # Contexto para assistência com IA
└── README.md              # Este arquivo
```

## Serviços Gerenciados

- **Samba 4**: Compartilhamento de arquivos com integração ao Active Directory
- **SSSD**: Autenticação centralizada via AD
- **UFW**: Controle de acesso por IP/porta
- **rclone**: Sincronização de backup com armazenamento em nuvem
- **rsync**: Cópia incremental local/remota de dados

## Uso Rápido

```bash
# Verificar status dos serviços
sudo systemctl status smbd nmbd sssd

# Aplicar regras de firewall
sudo bash ufw-rules.sh

# Executar backup manual
sudo bash scripts/backup-labsrv.sh

# Atualizar configs do Samba após edição
sudo cp config/smb.conf /etc/samba/smb.conf && sudo systemctl restart smbd
```

## Contato

**Equipe:** Suporte Laboratório Sobral
**E-mail:** suporte@laboratoriosobral.com
