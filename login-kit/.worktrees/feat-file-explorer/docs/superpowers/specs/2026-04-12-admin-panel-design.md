# LABSRVFILES Admin Panel — Design Spec
**Data:** 2026-04-12  
**Status:** Aprovado

---

## 1. Visão Geral

Painel web de administração para o servidor de arquivos LABSRVFILES, rodando no próprio servidor. Permite monitoramento em tempo real e operações administrativas sem acesso SSH direto. Otimizado para telas grandes (TV/monitor 32"+).

---

## 2. Stack Técnica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | Python 3.10 + FastAPI | Leve, async nativo, SSE built-in |
| Frontend | HTML/CSS/JS puro (sem framework) | Zero dependências de build, fácil manutenção |
| Auth | PAM (`python-pam`) | Mesmas credenciais do SSH/Linux — sem banco de usuários separado |
| Real-time | Server-Sent Events (SSE) | Simples para push unidirecional do servidor |
| Terminal | xterm.js + WebSocket (`asyncssh` ou `subprocess` com PTY) | Terminal web completo |
| Serviço | systemd (`labsrv-panel.service`) | Inicia com o servidor, restart automático |
| Porta | 8080 | Coberta pelo UFW (apenas rede interna 192.86.221.0/24) |

---

## 3. Autenticação e Autorização

### Login
- Formulário username + senha → validado via PAM
- PAM autentica contra Linux local **e** AD via SSSD (mesma stack do SSH)
- Sessão com token JWT em cookie httpOnly, expiração 8h
- Nenhuma credencial armazenada no painel

### Controle de Acesso
- **Fonte única:** grupo AD `LABSOBRALNET\Administradores` (futuramente `LABSOBRALNET\TI`)
- O painel **não adiciona, remove ou edita** usuários admin — apenas lê do AD
- Roles definidas no painel por Super Admin (mapeadas a usernames AD existentes):

| Role | Permissões |
|---|---|
| Super Admin | Tudo, incluindo gerenciar roles dos outros admins |
| Operador | Monitorar + restart serviços + desconectar usuário |
| Somente Leitura | Apenas visualizar |

- Se um usuário for removido do grupo AD `Administradores`, perde acesso automaticamente no próximo login
- Todas as ações admin são registradas em log interno (`/var/log/labsrv-panel-admin.log`)

---

## 4. Layout e Estilo

- **Tema:** Dark NOC (fundo `#0d1117`, estilo GitHub dark)
- **Layout:** Topbar fixa + Sidebar esquerda (200px) + Área de conteúdo principal
- **Topbar:** Logo, IP, status dots dos serviços (smbd/sssd/ufw/rsync), relógio ao vivo, usuário logado
- **Responsividade:** Não necessária — otimizado para 1920×1080+

---

## 5. Seções do Painel

### 5.1 Dashboard (tela inicial)
- 4 cards de resumo: Serviços ativos, Shares Samba, Conexões ativas, Status último backup
- Painel de Discos: barra de uso para cada mount (/, /mnt/hdd, /mnt/hdd2/backups, /mnt/hdd3)
- Painel de Serviços: smbd/nmbd/sssd/ufw com botão restart
- **Painel de Usuários Conectados:** grid 2 colunas com todas as sessões SMB ativas
  - Por sessão: nome completo (AD) + username na rede + grupo AD + share acessado + tempo conectado
  - Badge de alerta se houver acesso negado recente (do audit log)
  - Botões inline: **Auditar** e **Desconectar**
- Painel de Migração GDrive: drive atual em progresso + lista de drives (✓ concluído / ↻ rodando / ○ pendente)
- Painel de Backups Recentes: últimas 4 execuções (rsync + rclone) + horário do próximo

**Fonte dos dados:**
- `smbstatus -j` → conexões + shares
- `getent passwd <user>` + `id <user>` via SSSD → nome completo, grupo AD
- `df -h` → uso de disco
- `systemctl is-active` → status de serviços
- `~/migrate-gdrive-all.log` (parse) → progresso de migração
- `/var/log/backup-labsrv.log` → histórico de backup
- `/var/log/samba/audit.log` → alertas de acesso negado

### 5.2 Discos
- Tabela detalhada: device, mount point, tamanho total, usado, livre, uso %, shares hospedados
- Alerta visual quando uso > 80% (amarelo) e > 90% (vermelho)
- Dados via: `df -h`, `lsblk -J`

### 5.3 Shares
- Listagem dos 19 shares: nome, caminho, grupo AD vinculado, disco, status (acessível/erro)
- Indicador de usuários conectados no momento por share
- Dados via: `testparm -s --parameter-name` + `smbstatus -S`

### 5.4 Serviços
- smbd, nmbd, sssd, ufw
- Status, uptime, PID, uso de CPU/memória
- Botão **Restart** (com confirmação) → executa `systemctl restart <serviço>`
- Logs recentes do serviço (últimas 20 linhas de `journalctl -u <serviço>`)
- Apenas Super Admin e Operador podem executar restart

### 5.5 Conexões (smbstatus completo)
- Tabela completa de `smbstatus` com todas as sessões e arquivos abertos
- Filtro por usuário, share, IP
- Botão **Desconectar** por linha (executa `smbcontrol smbd close-share` ou kill da sessão)

### 5.6 Usuários AD
- Lista de todos os usuários do domínio visíveis via SSSD (`getent passwd`)
- Por usuário: username, nome completo, grupos AD, último login (wtmp), se tem sessão SMB ativa
- Leitura apenas — nenhuma edição

### 5.7 Migração GDrive
- Parse do log `~/migrate-gdrive-all.log`
- Drive atual: nome, progresso %, GB transferidos, velocidade, ETA, PID do processo
- Lista todos os 43 drives: status (concluído/rodando/pendente/erro), tamanho
- Status do processo nohup (PID 41219): vivo ou morto
- Espaço livre restante em /mnt/hdd3

### 5.8 Backup
- Histórico completo de `/var/log/backup-labsrv.log`
- Separado por tipo: rsync local (diário 23h) e rclone GDrive
- Status, tamanho, duração, arquivos transferidos
- Botão **Executar Backup Agora** → inicia rsync manualmente (apenas Super Admin)
- Próxima execução agendada (lida do crontab)

### 5.9 Logs
- Leitura de `/var/log/samba/audit.log`
- Colunas: timestamp, usuário (nome completo do AD), ação (CREATE/WRITE/DELETE/READ/LOGIN/DENIED), arquivo/path, share, IP
- Filtros: usuário, tipo de ação, share, intervalo de datas
- Paginação (100 linhas por página)
- Requer configuração do módulo `full_audit` no smb.conf (documentado)

### 5.10 Usuários Ativos (ações)
- Idêntico ao painel do Dashboard mas em tela cheia com mais detalhes
- Timeline de ações por usuário (últimas 50 entradas do audit log filtradas por username)
- **Auditoria Pontual:** modal com 4 counters (acessos, modificações, uploads, negados) + timeline completa + export CSV/PDF
- **Desconectar:** confirmação antes de executar

### 5.11 Admin Config
- Lista os membros atuais do grupo `LABSOBRALNET\Administradores` (via `getent group`)
- Para cada membro: nome completo (AD), username, role atribuída no painel
- Super Admin pode alterar roles — mas **não pode adicionar/remover do grupo AD** (isso é feito no Windows Server AD)
- Log de ações administrativas no painel (quem fez o quê e quando)
- Aviso: "Para adicionar/remover admins, edite o grupo Administradores no AD"

### 5.12 Terminal
- xterm.js no frontend, WebSocket no backend
- Abre PTY no servidor como usuário `admin` (não root diretamente)
- Apenas Super Admin tem acesso
- Sessão logada: início, fim, comandos executados

---

## 6. Fontes de Dados — Resumo

| Dado | Comando/Arquivo |
|---|---|
| Conexões SMB | `smbstatus -j` |
| Info usuário AD | `getent passwd <user>`, `id <user>` |
| Grupos AD do usuário | `id -Gn <user>` |
| Membros do grupo Admins | `getent group "LABSOBRALNET\\Administradores"` |
| Status serviços | `systemctl is-active <svc>` |
| Uso de disco | `df -h --output=source,target,size,used,avail,pcent` |
| Logs Samba audit | `/var/log/samba/audit.log` |
| Logs backup | `/var/log/backup-labsrv.log` |
| Progresso migração | `~/migrate-gdrive-all.log` (parse por linha) |
| Shares configurados | `testparm -s` |
| Logs de serviços | `journalctl -u <svc> -n 20` |

---

## 7. Segurança

- UFW: porta 8080 liberada apenas para `192.86.221.0/24`
- HTTPS: opcional (rede interna isolada pelo pfSense)
- JWT com segredo gerado na instalação (não hardcoded)
- Sem senha ou hash armazenado no painel
- Ações destrutivas (restart, disconnect) requerem confirmação e têm rate limit
- Nenhum dado do AD é cacheado além da sessão ativa

---

## 8. Estrutura de Arquivos (no servidor)

```
/opt/labsrv-panel/
├── main.py              # FastAPI app entry point
├── auth.py              # PAM auth + JWT
├── api/
│   ├── dashboard.py     # /api/dashboard SSE endpoint
│   ├── discos.py
│   ├── shares.py
│   ├── servicos.py
│   ├── conexoes.py
│   ├── usuarios.py
│   ├── migracao.py
│   ├── backup.py
│   ├── logs.py
│   └── terminal.py      # WebSocket PTY
├── static/
│   ├── index.html       # SPA shell + sidebar
│   ├── style.css        # Dark NOC theme
│   └── app.js           # Fetch + SSE client
└── requirements.txt
```

---

## 9. Instalação

```bash
# Instalar dependências
sudo apt install python3-pip python3-pam
pip3 install fastapi uvicorn python-pam pyjwt websockets

# Criar serviço systemd
sudo cp labsrv-panel.service /etc/systemd/system/
sudo systemctl enable --now labsrv-panel

# UFW
sudo ufw allow from 192.86.221.0/24 to any port 8080
```

---

## 10. Restrições Confirmadas

- O painel **não gerencia** usuários AD — apenas lê
- O painel **não gerencia** admins do painel — apenas lê do grupo AD `Administradores`
- Roles (Super Admin / Operador / Somente Leitura) são a única configuração interna do painel
- Dados de usuário (nome, grupo) vêm exclusivamente do AD via SSSD
