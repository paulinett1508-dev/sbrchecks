# 9 — Segurança
**Última atualização:** 2026-04-13

---

## 9.1 Modelo de Segurança

O servidor adota defesa em camadas:

```
Internet
   │
   ▼
pfSense (firewall de perímetro) — bloqueia tudo externo
   │
   ▼
Rede corporativa 192.86.221.0/24
   │
   ▼
UFW (firewall host) — permite apenas portas 22/139/445/8080
   │
   ▼
Samba + PAM + SSSD — autenticação AD obrigatória
   │
   ▼
Grupos AD por compartilhamento — autorização por grupo
```

## 9.2 Controle de Acesso

| Recurso | Mecanismo |
|---|---|
| Compartilhamentos SMB | Grupos AD por share |
| SSH | Chave pública + senha, apenas rede interna |
| Painel Web | PAM + JWT + grupo AD Administradores |
| Terminal Web | Apenas Super Admin, com log |

## 9.3 Auditoria

| Log | Conteúdo | Local |
|---|---|---|
| Audit Samba | CREATE / WRITE / DELETE / READ / DENIED por usuário | `/var/log/samba/audit.log` |
| Backup | Execuções e resultados | `/var/log/backup-labsrv.log` |
| Painel Admin | Ações administrativas no painel | `/var/log/labsrv-panel-admin.log` |
| Sistema | journald (smbd, sssd, ufw) | `journalctl -u <serviço>` |

## 9.4 Gestão de Segredos

- Nenhuma senha ou token é armazenado no repositório Git
- Tokens rclone: `~/.config/rclone/rclone.conf` (fora do repo)
- Segredo JWT do painel: gerado na instalação, armazenado em variável de ambiente
- Senhas de usuários: gerenciadas exclusivamente pelo AD

## 9.5 Atualizações

```bash
sudo apt update && sudo apt upgrade -y
```

Recomendado mensalmente, fora do horário comercial.
