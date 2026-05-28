# 9 — Segurança
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 9.1 Controle de Acesso

- Todo acesso ao servidor de arquivos requer autenticação via Active Directory
- Cada compartilhamento é acessível apenas pelo grupo AD correspondente
- Nenhum compartilhamento é público ou anônimo
- Administradores do painel web devem pertencer ao grupo `LABSOBRALNET\Administradores`

## 9.2 Firewall

O servidor possui duas camadas de proteção:

| Camada | Ferramenta | Função |
|---|---|---|
| Externa | pfSense | Bloqueio de tráfego externo à rede corporativa |
| Interna (host) | UFW | Controle de portas no próprio servidor |

**Portas liberadas pelo UFW:**

| Porta | Protocolo | Serviço | Origem permitida |
|---|---|---|---|
| 22 | TCP | SSH | 192.86.221.0/24 (rede interna) |
| 139 | TCP | SMB (NetBIOS) | 192.86.221.0/24 |
| 445 | TCP | SMB | 192.86.221.0/24 |
| 8080 | TCP | Painel Web | 192.86.221.0/24 |

Nenhuma porta está acessível pela internet.

## 9.3 Auditoria de Acessos

O Samba registra operações de arquivo no log de auditoria:

```bash
# Visualizar log de auditoria
tail -100 /var/log/samba/audit.log
```

O Painel de Administração → **Logs** permite filtrar por usuário, ação e intervalo de datas.

## 9.4 Políticas de Senha

- Senhas são gerenciadas exclusivamente pelo Active Directory
- Não há senhas armazenadas no servidor de arquivos
- A senha do painel web é a mesma do domínio AD

## 9.5 Procedimento em Caso de Incidente

1. **Acesso não autorizado detectado:** identificar o usuário no log de auditoria, revogar acesso imediatamente via AD, registrar incidente
2. **Arquivo deletado indevidamente:** restaurar do backup conforme módulo [06 — Backup](06-backup.md), identificar responsável no log de auditoria
3. **Comprometimento de senha:** forçar reset da senha no AD, revogar sessões ativas no painel, notificar o usuário

## 9.6 Atualizações de Segurança

```bash
# Verificar atualizações disponíveis
sudo apt update && apt list --upgradable

# Aplicar atualizações de segurança
sudo apt upgrade -y
```

Recomenda-se aplicar atualizações mensalmente, preferencialmente fora do horário comercial.
