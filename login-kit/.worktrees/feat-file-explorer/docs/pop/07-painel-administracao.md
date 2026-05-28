# 7 — Painel de Administração
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 7.1 Objetivo

Descrever o uso do Painel de Administração Web do servidor LABSRVFILES para monitoramento e operações administrativas.

## 7.2 Acesso

| Campo | Detalhe |
|---|---|
| **URL** | http://192.86.221.213:8080 |
| **Usuário** | Credenciais do domínio AD (mesmas do Windows) |
| **Perfis de acesso** | Super Admin / Operador / Somente Leitura |
| **Acesso permitido** | Apenas rede interna (192.86.221.0/24) |

**Pré-requisito:** o usuário deve ser membro do grupo AD `LABSOBRALNET\Administradores`.

## 7.3 Seções do Painel

| Seção | O que mostra | Ações disponíveis |
|---|---|---|
| **Dashboard** | Resumo geral: serviços, discos, conexões ativas, backup | — |
| **Discos** | Uso de cada disco com alertas visuais | — |
| **Shares** | Lista dos 19 compartilhamentos e usuários conectados | — |
| **Serviços** | Status de smbd, nmbd, sssd, ufw | Restart (Operador+) |
| **Conexões** | Sessões SMB ativas com detalhes | Desconectar (Operador+) |
| **Usuários AD** | Usuários do domínio e seus grupos | — |
| **Migração GDrive** | Progresso da migração dos drives | — |
| **Backup** | Histórico e próxima execução | Executar agora (Super Admin) |
| **Logs** | Audit log do Samba filtrado | — |
| **Terminal** | Terminal web no servidor | Comandos (Super Admin) |
| **Admin Config** | Roles dos administradores do painel | Alterar roles (Super Admin) |

## 7.4 Operações Comuns

### Reiniciar um serviço

1. Acessar **Serviços**
2. Localizar o serviço (smbd, nmbd, sssd ou ufw)
3. Clicar em **Restart**
4. Confirmar na caixa de diálogo
5. Aguardar status atualizar para `active`

### Desconectar usuário

1. Acessar **Conexões**
2. Localizar a sessão do usuário
3. Clicar em **Desconectar**
4. Confirmar na caixa de diálogo

### Verificar progresso do backup

1. Acessar **Backup**
2. Verificar a linha mais recente da execução

## 7.5 Serviço do Painel

O painel é gerenciado pelo systemd como `labsrv-panel`:

```bash
# Verificar status
sudo systemctl status labsrv-panel

# Reiniciar painel
sudo systemctl restart labsrv-panel

# Ver logs do painel
journalctl -u labsrv-panel -n 50
```
