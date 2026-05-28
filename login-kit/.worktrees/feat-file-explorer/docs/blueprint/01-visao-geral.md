# 1 — Visão Geral do Sistema
**Última atualização:** 2026-04-13

---

## 1.1 Descrição

O **LABSRVFILES** é o servidor de arquivos centralizado do Laboratório Sobral. Provê compartilhamentos de arquivos via protocolo SMB para 19 departamentos, com autenticação integrada ao Active Directory corporativo.

## 1.2 Identificação

| Campo | Valor |
|---|---|
| Hostname | LABSRVFILES |
| IP | 192.86.221.213 |
| Sistema Operacional | Ubuntu Server 22.04.5 LTS |
| Domínio AD | labsobralnet.ind |
| Acesso administrativo | admin@192.86.221.213 (SSH porta 22) |
| Painel Web | http://192.86.221.213:8080 |

## 1.3 Arquitetura Geral

```
┌─────────────────────────────────────────────────────┐
│                    REDE CORPORATIVA                  │
│                  192.86.221.0/24                     │
│                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │ pfSense  │    │  AD/DNS      │    │  Clientes  │ │
│  │ Firewall │    │192.86.221.218│    │  Windows   │ │
│  └──────────┘    └──────────────┘    └─────┬──────┘ │
│       │                │                   │        │
│       └────────────────┴───────────────────┘        │
│                        │ SMB (445/139)               │
│              ┌─────────▼──────────┐                 │
│              │    LABSRVFILES     │                 │
│              │  192.86.221.213    │                 │
│              │                    │                 │
│              │  Samba 4.x ────────┼─ /srv/samba     │
│              │  SSSD ─────────────┼─ AD auth        │
│              │  UFW ──────────────┼─ host firewall  │
│              │  rsync ────────────┼─ backup local   │
│              │  rclone ───────────┼─ backup GDrive  │
│              │  labsrv-panel:8080 │                 │
│              └────────────────────┘                 │
└─────────────────────────────────────────────────────┘
```

## 1.4 Repositório de Configuração

Todas as configurações, scripts e documentação são versionadas em:

`github.com/paulinett1508-dev/labsrvfiles` (repositório privado)

O repositório está clonado no servidor em `~/labsrvfiles/` e sincronizado via `git pull`.
