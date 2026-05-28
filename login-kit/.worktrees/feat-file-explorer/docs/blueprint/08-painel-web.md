# 8 — Painel de Administração Web
**Última atualização:** 2026-04-13

---

## 8.1 Visão Geral

Interface web de administração do servidor, acessível em `http://192.86.221.213:8080`. Desenvolvida em Python (FastAPI) com frontend HTML/CSS/JS puro. Permite monitoramento em tempo real e operações administrativas sem acesso SSH direto.

## 8.2 Stack Técnica

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.10 + FastAPI |
| Frontend | HTML5 / CSS3 / JavaScript (sem framework) |
| Autenticação | PAM (`python-pam`) + JWT (cookie httpOnly, 8h) |
| Real-time | Server-Sent Events (SSE) |
| Terminal web | xterm.js + WebSocket + PTY |
| Serviço | systemd (`labsrv-panel.service`) |

## 8.3 Autenticação

- Login via PAM → autentica contra Linux local **e** AD via SSSD
- Mesmas credenciais do SSH e do domínio Windows
- JWT armazenado em cookie httpOnly — nenhuma senha guardada no painel
- Acesso restrito a membros do grupo AD `LABSOBRALNET\Administradores`
- Roles internas: **Super Admin** / **Operador** / **Somente Leitura**
- Roles definidas em `panel/roles.json`

## 8.4 Estrutura do Código

```
panel/
├── main.py              # FastAPI app entry point
├── auth.py              # PAM auth + JWT
├── config.py            # Configurações (porta, segredo JWT)
├── parsers.py           # Parse de outputs de sistema (samba, logs)
├── roles.json           # Mapeamento username → role
├── requirements.txt     # Dependências Python
├── install.sh           # Script de instalação
├── labsrv-panel.service # Unidade systemd
├── api/
│   ├── dashboard.py     # SSE endpoint de resumo geral
│   ├── discos.py        # df -h + lsblk
│   ├── shares.py        # testparm + smbstatus -S
│   ├── servicos.py      # systemctl status + restart
│   ├── conexoes.py      # smbstatus completo
│   ├── usuarios.py      # getent passwd + id
│   ├── migracao.py      # parse de ~/migrate-gdrive-all.log
│   ├── backup.py        # parse de /var/log/backup-labsrv.log
│   ├── logs_samba.py    # parse de /var/log/samba/audit.log
│   ├── admin.py         # gerenciamento de roles
│   └── terminal.py      # WebSocket PTY
└── static/
    ├── index.html       # SPA shell + sidebar
    ├── login.html       # Página de login
    ├── style.css        # Dark NOC theme (#0d1117)
    └── app.js           # Fetch + SSE client
```

## 8.5 Gerenciamento do Serviço

```bash
# Status
sudo systemctl status labsrv-panel

# Reiniciar
sudo systemctl restart labsrv-panel

# Logs
journalctl -u labsrv-panel -n 50 --no-pager

# Habilitar no boot
sudo systemctl enable labsrv-panel
```

## 8.6 Segurança

- Porta 8080 liberada no UFW apenas para 192.86.221.0/24
- JWT com segredo gerado na instalação (não hardcoded)
- Ações destrutivas (restart, disconnect) requerem confirmação + rate limit
- Todas as ações admin registradas em `/var/log/labsrv-panel-admin.log`
- Terminal web restrito a Super Admin, com log de comandos
