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
│   ├── smb.conf          # Configuração do Samba
│   └── sssd.conf         # Configuração do SSSD (AD auth)
├── scripts/
│   └── backup-labsrv.sh  # Script de backup automatizado
├── docs/
│   └── (documentação operacional)
├── tasks/
│   └── (tasks e checklists operacionais)
├── ufw-rules.sh          # Regras do firewall UFW
├── TASKS_PENDENTES.md    # Backlog de tarefas
├── CLAUDE.md             # Contexto para assistência com IA
└── README.md             # Este arquivo
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
