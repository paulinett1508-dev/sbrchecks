# 5 — Autenticação e Active Directory
**Última atualização:** 2026-04-13

---

## 5.1 Visão Geral

A autenticação de usuários é realizada pelo **SSSD** (System Security Services Daemon), que integra o servidor Linux ao Active Directory da empresa. Isso permite que usuários do domínio façam login no servidor usando as mesmas credenciais do Windows.

## 5.2 Infraestrutura de AD

| Campo | Valor |
|---|---|
| Servidor AD | 192.86.221.218 |
| Sistema | Windows Server 2012 |
| Domínio NetBIOS | LABSOBRALNET |
| Domínio FQDN | labsobralnet.ind |
| DNS primário | 192.86.221.218 |
| DNS secundário | 8.8.8.8 (fallback) |

## 5.3 Fluxo de Autenticação

```
Cliente Windows
      │
      │ SMB (credenciais domínio)
      ▼
   Samba 4.x
      │
      │ PAM / SSSD
      ▼
   SSSD ──────► AD (192.86.221.218)
                 Valida: usuário + senha + grupo
      │
      ▼
   Acesso concedido ao share (se no grupo correto)
```

## 5.4 Configuração SSSD

Arquivo: `/etc/sssd/sssd.conf` (permissão obrigatória: `600`)

Versionado em: `config/sssd.conf`

**Atenção:** após qualquer edição:
```bash
sudo chmod 600 /etc/sssd/sssd.conf
sudo systemctl restart sssd
```

## 5.5 Diagnóstico

```bash
# Verificar se usuário AD é visível no servidor
id usuario@labsobralnet.ind

# Listar grupos AD do usuário
id -Gn usuario@labsobralnet.ind

# Verificar status do SSSD
sudo systemctl status sssd

# Logs do SSSD
journalctl -u sssd -n 50

# Testar resolução do controlador de domínio
ping -c2 192.86.221.218
nslookup labsobralnet.ind 192.86.221.218
```
