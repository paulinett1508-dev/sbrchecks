# 4 — Operação Diária
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 4.1 Objetivo

Definir as verificações mínimas que o administrador de TI deve realizar diariamente para garantir a disponibilidade e integridade do servidor de arquivos.

## 4.2 Frequência

Diária — preferencialmente no início do expediente.

## 4.3 Procedimento

### 4.3.1 Verificar status dos serviços

Acessar o Painel de Administração (`http://192.86.221.213:8080`) ou via SSH:

```bash
sudo systemctl status smbd nmbd sssd
```

**Resultado esperado:** todos os serviços com status `active (running)`.

**Ação em caso de serviço parado:** consultar o módulo [08 — Resolução de Problemas](08-resolucao-problemas.md).

### 4.3.2 Verificar uso de disco

```bash
df -h | grep -E '/$|/mnt/'
```

**Limites de atenção:**

| Disco | Mount | Alerta | Crítico |
|---|---|---|---|
| sdb (SSD 953GB) | `/` e `/srv/samba` | 80% | 90% |
| sdc (HDD 465GB) | `/mnt/hdd/samba` | 80% | 90% |
| sda (HDD 465GB) | `/mnt/hdd2/backups` | 85% | 95% |
| sdd (HDD 465GB) | `/mnt/hdd3` | 80% | 90% |

**Ação em caso de disco acima de 80%:** verificar arquivos grandes, acionar responsável do departamento para limpeza ou solicitar expansão de storage.

### 4.3.3 Verificar backup da noite anterior

```bash
tail -30 /var/log/backup-labsrv.log
```

**Resultado esperado:** última linha contendo `Backup concluído` ou equivalente, com data do dia anterior.

**Ação em caso de falha:** consultar o módulo [06 — Backup e Restauração](06-backup.md).

### 4.3.4 Verificar conexões ativas (opcional)

```bash
sudo smbstatus -b
```

Ou pelo Painel de Administração → seção **Conexões**.

## 4.4 Registros

O administrador deve registrar qualquer anomalia encontrada durante a verificação diária, com data, hora e ação tomada, no arquivo `tasks/TASKS_PENDENTES.md` do repositório ou no sistema de chamados da empresa.
