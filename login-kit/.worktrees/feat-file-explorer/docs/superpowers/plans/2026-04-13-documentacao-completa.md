# Documentação Completa LABSRVFILES — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar documentação completa e modular do sistema LABSRVFILES — POP, Blueprint Técnico e Manual de Usuários — em português, cada um com audiência e tom adequados.

**Architecture:** Estrutura modular em `docs/pop/`, `docs/blueprint/` e `docs/manual-usuarios/`. Arquivos raiz existentes viram índices. Cada módulo é autocontido e numerado para facilitar adaptação ao template Word da empresa.

**Tech Stack:** Markdown, git. Sem dependências de build.

---

## Mapa de Arquivos

### Criados
- `docs/pop/01-objetivo-escopo.md`
- `docs/pop/02-responsabilidades.md`
- `docs/pop/03-glossario.md`
- `docs/pop/04-operacao-diaria.md`
- `docs/pop/05-gestao-usuarios.md`
- `docs/pop/06-backup.md`
- `docs/pop/07-painel-administracao.md`
- `docs/pop/08-resolucao-problemas.md`
- `docs/pop/09-seguranca.md`
- `docs/pop/10-historico-revisoes.md`
- `docs/blueprint/01-visao-geral.md`
- `docs/blueprint/02-hardware-storage.md`
- `docs/blueprint/03-servicos.md`
- `docs/blueprint/04-compartilhamentos.md`
- `docs/blueprint/05-autenticacao-ad.md`
- `docs/blueprint/06-rede-firewall.md`
- `docs/blueprint/07-backup-recuperacao.md`
- `docs/blueprint/08-painel-web.md`
- `docs/blueprint/09-seguranca.md`
- `docs/blueprint/10-migracao-gdrive.md`
- `docs/manual-usuarios/01-introducao.md`
- `docs/manual-usuarios/02-acesso-windows.md`
- `docs/manual-usuarios/03-uso-compartilhamentos.md`
- `docs/manual-usuarios/04-problemas-comuns.md`
- `docs/manual-usuarios/05-suporte.md`

### Modificados
- `docs/POP.md` → convertido em índice
- `docs/Blueprint_Tecnico.md` → convertido em índice
- `docs/Manual_de_Uso.md` → convertido em índice
- `CLAUDE.md` → adiciona seção do painel, atualiza referências de docs

---

## Task 1: Estrutura de diretórios e índices

**Files:**
- Create: `docs/pop/` (diretório)
- Create: `docs/blueprint/` (diretório)
- Create: `docs/manual-usuarios/` (diretório)
- Modify: `docs/POP.md`
- Modify: `docs/Blueprint_Tecnico.md`
- Modify: `docs/Manual_de_Uso.md`

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p docs/pop docs/blueprint docs/manual-usuarios
```

- [ ] **Step 2: Converter docs/POP.md em índice**

Substituir conteúdo de `docs/POP.md`:

```markdown
# POP — Procedimentos Operacionais Padrão
> Servidor de Arquivos LABSRVFILES — Laboratório Sobral

## Módulos

1. [Objetivo e Escopo](pop/01-objetivo-escopo.md)
2. [Responsabilidades](pop/02-responsabilidades.md)
3. [Glossário](pop/03-glossario.md)
4. [Operação Diária](pop/04-operacao-diaria.md)
5. [Gestão de Usuários](pop/05-gestao-usuarios.md)
6. [Backup e Restauração](pop/06-backup.md)
7. [Painel de Administração](pop/07-painel-administracao.md)
8. [Resolução de Problemas](pop/08-resolucao-problemas.md)
9. [Segurança](pop/09-seguranca.md)
10. [Histórico de Revisões](pop/10-historico-revisoes.md)
```

- [ ] **Step 3: Converter docs/Blueprint_Tecnico.md em índice**

Substituir conteúdo de `docs/Blueprint_Tecnico.md`:

```markdown
# Blueprint Técnico — LABSRVFILES
> Servidor de Arquivos — Laboratório Sobral

## Módulos

1. [Visão Geral do Sistema](blueprint/01-visao-geral.md)
2. [Hardware e Storage](blueprint/02-hardware-storage.md)
3. [Serviços e Processos](blueprint/03-servicos.md)
4. [Compartilhamentos Samba](blueprint/04-compartilhamentos.md)
5. [Autenticação e Active Directory](blueprint/05-autenticacao-ad.md)
6. [Rede e Firewall](blueprint/06-rede-firewall.md)
7. [Backup e Recuperação](blueprint/07-backup-recuperacao.md)
8. [Painel de Administração Web](blueprint/08-painel-web.md)
9. [Segurança](blueprint/09-seguranca.md)
10. [Migração Google Drive](blueprint/10-migracao-gdrive.md) `[TEMPORÁRIO]`
```

- [ ] **Step 4: Converter docs/Manual_de_Uso.md em índice**

Substituir conteúdo de `docs/Manual_de_Uso.md`:

```markdown
# Manual de Uso — Servidor de Arquivos
> Laboratório Sobral

## Capítulos

1. [Introdução](manual-usuarios/01-introducao.md)
2. [Como Acessar pelo Windows](manual-usuarios/02-acesso-windows.md)
3. [Como Usar os Compartilhamentos](manual-usuarios/03-uso-compartilhamentos.md)
4. [Problemas Comuns](manual-usuarios/04-problemas-comuns.md)
5. [Suporte](manual-usuarios/05-suporte.md)
```

- [ ] **Step 5: Commit**

```bash
git add docs/POP.md docs/Blueprint_Tecnico.md docs/Manual_de_Uso.md
git commit -m "docs: converte índices raiz para estrutura modular"
```

---

## Task 2: POP — Objetivo, Escopo e Responsabilidades

**Files:**
- Create: `docs/pop/01-objetivo-escopo.md`
- Create: `docs/pop/02-responsabilidades.md`

- [ ] **Step 1: Escrever docs/pop/01-objetivo-escopo.md**

```markdown
# 1 — Objetivo e Escopo
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 1.1 Objetivo

Este Procedimento Operacional Padrão (POP) tem como objetivo estabelecer as diretrizes, responsabilidades e procedimentos necessários para a operação, manutenção e uso do **Servidor de Arquivos do Laboratório Sobral (LABSRVFILES)**.

O servidor centraliza o armazenamento de documentos institucionais, garantindo:

- Acesso controlado por departamento
- Rastreabilidade de operações
- Disponibilidade contínua dos arquivos durante o horário de funcionamento da empresa
- Integridade dos dados por meio de rotinas de backup automatizadas

## 1.2 Escopo

Este POP aplica-se a:

- **Equipe de TI:** responsável pela administração, manutenção e suporte do servidor
- **Gestores de Departamento:** responsáveis por orientar seus colaboradores sobre o uso correto dos compartilhamentos
- **Colaboradores em geral:** usuários do servidor de arquivos em suas atividades diárias
- **Departamento da Qualidade:** para fins de auditoria e verificação de conformidade operacional

Este POP **não** abrange:

- Gestão de Active Directory (realizada no servidor Windows — 192.86.221.218)
- Infraestrutura de rede externa (gerenciada pelo pfSense)
- Dispositivos dos usuários finais

## 1.3 Documentos Relacionados

| Documento | Localização |
|---|---|
| Blueprint Técnico | `docs/Blueprint_Tecnico.md` |
| Manual de Usuários | `docs/Manual_de_Uso.md` |
| Configuração Samba | `config/smb.conf` |
| Configuração SSSD | `config/sssd.conf` |
| Regras de Firewall | `ufw-rules.sh` |
```

- [ ] **Step 2: Escrever docs/pop/02-responsabilidades.md**

```markdown
# 2 — Responsabilidades
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 2.1 Administrador de TI

- Manter o servidor em operação e disponível durante o horário comercial
- Executar e verificar as rotinas de backup diárias
- Gerenciar a criação e remoção de compartilhamentos (shares)
- Monitorar uso de disco e tomar ação preventiva antes de atingir capacidade crítica
- Aplicar atualizações de segurança do sistema operacional
- Registrar alterações de configuração no repositório Git (`github.com/paulinett1508-dev/labsrvfiles`)
- Atender chamados de suporte relacionados ao servidor de arquivos
- Revisar este POP anualmente ou após mudanças significativas no sistema

## 2.2 Gestor de Departamento

- Informar ao TI quais colaboradores de seu departamento necessitam de acesso ao servidor
- Solicitar ao TI a criação ou remoção de acessos ao mudar colaboradores de função ou desligá-los
- Orientar os colaboradores sobre o uso correto do compartilhamento do seu departamento
- Não compartilhar credenciais de acesso com terceiros

## 2.3 Colaborador / Usuário Final

- Utilizar o servidor de arquivos exclusivamente para fins profissionais
- Armazenar documentos apenas no compartilhamento do seu departamento
- Não armazenar arquivos pessoais, de entretenimento ou de grande volume desnecessário
- Comunicar imediatamente ao TI qualquer dificuldade de acesso ou comportamento anormal
- Não tentar acessar compartilhamentos de outros departamentos

## 2.4 Departamento da Qualidade

- Auditar periodicamente o cumprimento deste POP
- Solicitar evidências de backup e operação quando necessário
- Registrar não-conformidades e acompanhar ações corretivas junto ao TI
```

- [ ] **Step 3: Commit**

```bash
git add docs/pop/01-objetivo-escopo.md docs/pop/02-responsabilidades.md
git commit -m "docs(pop): adiciona objetivo, escopo e responsabilidades"
```

---

## Task 3: POP — Glossário

**Files:**
- Create: `docs/pop/03-glossario.md`

- [ ] **Step 1: Escrever docs/pop/03-glossario.md**

```markdown
# 3 — Glossário
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

| Termo | Definição |
|---|---|
| **Active Directory (AD)** | Sistema da Microsoft que gerencia usuários, senhas e permissões da rede da empresa. Funciona no servidor Windows (192.86.221.218). |
| **Backup** | Cópia de segurança dos arquivos armazenados no servidor, realizada automaticamente todo dia às 23h. |
| **Compartilhamento (Share)** | Pasta do servidor acessível pela rede. Cada departamento possui seu próprio compartilhamento. |
| **Domínio** | Rede corporativa gerenciada pelo Active Directory. O domínio da empresa é `labsobralnet.ind`. |
| **Firewall (UFW)** | Software de segurança que controla quais computadores podem se comunicar com o servidor. |
| **LABSRVFILES** | Nome do servidor de arquivos. IP: 192.86.221.213. |
| **Painel de Administração** | Interface web para monitoramento e administração do servidor. Acessível em `http://192.86.221.213:8080`. Uso exclusivo da equipe de TI. |
| **Samba** | Software que permite o compartilhamento de arquivos entre o servidor Linux e os computadores Windows da rede. |
| **SMB** | Protocolo de rede utilizado pelo Windows para acessar compartilhamentos de arquivos. |
| **SSSD** | Software que conecta o servidor Linux ao Active Directory, permitindo que usuários do domínio façam login no servidor. |
| **rsync** | Ferramenta utilizada para realizar o backup incremental dos arquivos (copia apenas o que mudou). |
| **rclone** | Ferramenta utilizada para enviar backups ao Google Drive da empresa. |
| **SSH** | Protocolo de acesso remoto seguro ao servidor. Uso exclusivo da equipe de TI. |
| **Grupo AD** | Conjunto de usuários no Active Directory com as mesmas permissões de acesso a um compartilhamento. |
| **pfSense** | Firewall de perímetro da rede corporativa (camada externa de proteção). |
```

- [ ] **Step 2: Commit**

```bash
git add docs/pop/03-glossario.md
git commit -m "docs(pop): adiciona glossário"
```

---

## Task 4: POP — Operação Diária

**Files:**
- Create: `docs/pop/04-operacao-diaria.md`

- [ ] **Step 1: Escrever docs/pop/04-operacao-diaria.md**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/pop/04-operacao-diaria.md
git commit -m "docs(pop): adiciona procedimento de operação diária"
```

---

## Task 5: POP — Gestão de Usuários

**Files:**
- Create: `docs/pop/05-gestao-usuarios.md`

- [ ] **Step 1: Escrever docs/pop/05-gestao-usuarios.md**

```markdown
# 5 — Gestão de Usuários
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 5.1 Objetivo

Padronizar os procedimentos de criação, alteração e remoção de acessos ao servidor de arquivos para colaboradores da empresa.

## 5.2 Como funciona o acesso

O acesso ao servidor de arquivos é controlado pelo **Active Directory (AD)**. Cada compartilhamento está vinculado a um grupo AD. Um colaborador recebe acesso ao incluir seu usuário AD no grupo correspondente ao seu departamento.

**Exceção:** os compartilhamentos `COMERCIAL_VENDAS` e `LINKS_UTEIS` utilizam usuários locais do servidor (`comercial1`, `comercial2`, `comercial3`, `vendedores`).

## 5.3 Conceder acesso a um novo colaborador

**Pré-requisito:** o colaborador já deve ter um usuário criado no Active Directory (Windows Server 192.86.221.218).

1. Identificar o grupo AD do departamento na tabela abaixo
2. Acessar o Active Directory no Windows Server como administrador
3. Localizar o grupo do departamento em "Usuários e Computadores do Active Directory"
4. Adicionar o usuário do colaborador ao grupo
5. Solicitar ao colaborador que teste o acesso: `Win + R` → `\\192.86.221.213`
6. Confirmar que o compartilhamento aparece e é acessível

**Tabela de grupos por departamento:**

| Departamento | Compartilhamento | Grupo AD |
|---|---|---|
| Sistema da Qualidade / Técnico | DEPARTAMENTO_TECNICO | LABSOBRALNET\SISTEMA DA QUALIDADE |
| Contabilidade | CONTABILIDADE, FISCAL | LABSOBRALNET\CONTABILIDADE |
| Controladoria | CONTROLADORIA | LABSOBRALNET\CONTROLADORIA |
| Financeiro | FINANCEIRO | LABSOBRALNET\FINANCEIRO |
| RH | RECURSOS_HUMANOS | LABSOBRALNET\RECURSOS HUMANOS |
| Industrial | INDUSTRIAL | LABSOBRALNET\INDUSTRIAL |
| Suprimentos / PCP | SUPRIMENTOS | LABSOBRALNET\PCP |
| Manutenção | MANUTENCAO | LABSOBRALNET\MANUTENÇÃO |
| Logística | LOGISTICA_RECEBIMENTO, LOGISTICA_EXPEDICAO | LABSOBRALNET\LOGISTICA |
| Marketing | MARKETING | LABSOBRALNET\MARKETING |
| Segurança do Trabalho | SEGURANCA_TRABALHO | LABSOBRALNET\SESMT |
| Serviços Gerais | SERVICOS_GERAIS | LABSOBRALNET\SERVICOS GERAIS |
| Diretoria | DIRETORIAS | LABSOBRALNET\PRESIDENCIA |
| Secretaria | SECRETARIA | LABSOBRALNET\SECRETARIA |
| TI | TI | LABSOBRALNET\Administradores |

## 5.4 Revogar acesso de um colaborador

1. Acessar o Active Directory no Windows Server
2. Remover o usuário do grupo AD do departamento
3. Se o colaborador estiver conectado no momento, desconectá-lo pelo Painel de Administração → **Conexões** → botão **Desconectar**
4. Se for desligamento, desativar a conta AD do colaborador

## 5.5 Redefinir senha de acesso

A senha de acesso ao servidor de arquivos é a **mesma senha do domínio** (login do Windows). Para redefinir:

1. Acessar o Active Directory no Windows Server como administrador
2. Localizar o usuário
3. Clicar com botão direito → "Redefinir senha"
4. Informar a nova senha ao colaborador por canal seguro (não por e-mail)

## 5.6 Usuários locais (COMERCIAL_VENDAS / LINKS_UTEIS)

Para os compartilhamentos que utilizam usuários locais do servidor:

```bash
# Alterar senha de usuário local
sudo passwd comercial1

# Verificar usuários locais existentes
cut -d: -f1 /etc/passwd | grep -v '#'
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/pop/05-gestao-usuarios.md
git commit -m "docs(pop): adiciona gestão de usuários e acessos"
```

---

## Task 6: POP — Backup e Painel

**Files:**
- Create: `docs/pop/06-backup.md`
- Create: `docs/pop/07-painel-administracao.md`

- [ ] **Step 1: Escrever docs/pop/06-backup.md**

```markdown
# 6 — Backup e Restauração
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 6.1 Objetivo

Garantir a integridade e recuperabilidade dos dados armazenados no servidor de arquivos por meio de rotinas automatizadas de backup.

## 6.2 Rotinas de Backup

### 6.2.1 Backup Incremental Local (diário)

| Campo | Detalhe |
|---|---|
| **Ferramenta** | rsync |
| **Frequência** | Diária às 23h00 (cron) |
| **Origem** | `/srv/samba/` e `/mnt/hdd/samba/` |
| **Destino** | `/mnt/hdd2/backups/` (disco sda — 465GB dedicado) |
| **Tipo** | Incremental — copia apenas arquivos novos ou modificados |
| **Log** | `/var/log/backup-labsrv.log` |

### 6.2.2 Backup em Nuvem (Google Drive)

| Campo | Detalhe |
|---|---|
| **Ferramenta** | rclone v1.73.4 |
| **Remote** | `gdrive-labsobral` → BACKUP_SERVIDOR (Shared Drive) |
| **Conta** | suporte@laboratoriosobral.com |
| **Frequência** | Configurado separadamente (ver crontab) |
| **Log** | `/var/log/rclone-backup.log` |

## 6.3 Verificar Status do Backup

```bash
# Verificar log do backup local
tail -30 /var/log/backup-labsrv.log

# Verificar se backup foi executado hoje
grep "$(date +%Y-%m-%d)" /var/log/backup-labsrv.log | tail -5
```

Ou pelo Painel de Administração → seção **Backup**.

## 6.4 Executar Backup Manual

```bash
sudo bash /home/admin/labsrvfiles/scripts/backup-labsrv.sh
```

## 6.5 Restaurar Arquivo ou Pasta

### 6.5.1 Localizar o arquivo no backup

```bash
# Listar conteúdo do backup
ls /mnt/hdd2/backups/

# Buscar arquivo específico
find /mnt/hdd2/backups/ -name "nome-do-arquivo*"
```

### 6.5.2 Restaurar arquivo individual

```bash
# Restaurar para localização original
sudo cp /mnt/hdd2/backups/srv/samba/DEPARTAMENTO/arquivo.docx \
        /srv/samba/DEPARTAMENTO/arquivo.docx

# Ajustar permissões após restauração
sudo chown root:nome-grupo /srv/samba/DEPARTAMENTO/arquivo.docx
sudo chmod 0660 /srv/samba/DEPARTAMENTO/arquivo.docx
```

### 6.5.3 Restaurar pasta completa

```bash
sudo rsync -av /mnt/hdd2/backups/srv/samba/DEPARTAMENTO/ \
               /srv/samba/DEPARTAMENTO/
```

## 6.6 Registros

Toda restauração deve ser registrada com: data, arquivo/pasta restaurado, solicitante, motivo.
```

- [ ] **Step 2: Escrever docs/pop/07-painel-administracao.md**

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add docs/pop/06-backup.md docs/pop/07-painel-administracao.md
git commit -m "docs(pop): adiciona procedimentos de backup e painel de administração"
```

---

## Task 7: POP — Resolução de Problemas e Segurança

**Files:**
- Create: `docs/pop/08-resolucao-problemas.md`
- Create: `docs/pop/09-seguranca.md`
- Create: `docs/pop/10-historico-revisoes.md`

- [ ] **Step 1: Escrever docs/pop/08-resolucao-problemas.md**

```markdown
# 8 — Resolução de Problemas
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 8.1 Usuário não consegue acessar o compartilhamento

**Sintoma:** mensagem "Acesso negado" ou pasta não aparece ao acessar `\\192.86.221.213`.

**Diagnóstico:**

1. Verificar se o usuário está no grupo AD correto:
   ```bash
   id usuario@labsobralnet.ind
   ```
2. Verificar se o serviço Samba está ativo:
   ```bash
   sudo systemctl status smbd
   ```
3. Verificar se o compartilhamento está na configuração:
   ```bash
   testparm -s | grep -A5 "NOME_DO_SHARE"
   ```

**Ação:** se o usuário não estiver no grupo AD, adicionar conforme módulo [05 — Gestão de Usuários](05-gestao-usuarios.md). Se o Samba estiver parado, reiniciar.

---

## 8.2 Serviço Samba parado (smbd/nmbd)

**Sintoma:** usuários não conseguem acessar nenhum compartilhamento.

```bash
# Verificar status
sudo systemctl status smbd

# Ver últimas mensagens de erro
journalctl -u smbd -n 30

# Reiniciar
sudo systemctl restart smbd nmbd

# Confirmar
sudo systemctl status smbd
```

Se o restart falhar, verificar configuração:

```bash
testparm -s
```

---

## 8.3 Autenticação AD falhou (SSSD parado)

**Sintoma:** usuários do domínio não conseguem logar; erro "invalid credentials" mesmo com senha correta.

```bash
# Verificar status SSSD
sudo systemctl status sssd

# Ver logs
journalctl -u sssd -n 30

# Testar resolução do domínio
ping -c2 192.86.221.218

# Reiniciar SSSD
sudo systemctl restart sssd

# Testar autenticação
id usuario@labsobralnet.ind
```

---

## 8.4 Disco cheio ou próximo do limite

**Sintoma:** usuários recebem erro ao salvar arquivos; alerta de disco no painel.

```bash
# Verificar uso de disco
df -h | grep -E '/$|/mnt/'

# Identificar maiores diretórios
du -sh /srv/samba/* | sort -rh | head -10
du -sh /mnt/hdd/samba/* | sort -rh | head -10
```

**Ação:**
1. Acionar o gestor do departamento mais cheio para revisão de arquivos
2. Mover arquivos antigos para `/mnt/hdd3` se necessário
3. Se crítico (>95%), parar serviços não essenciais e liberar espaço imediatamente

---

## 8.5 Backup não executou

**Sintoma:** log de backup sem entrada do dia anterior.

```bash
# Verificar crontab
crontab -l | grep backup

# Verificar log
tail -50 /var/log/backup-labsrv.log

# Executar manualmente para testar
sudo bash /home/admin/labsrvfiles/scripts/backup-labsrv.sh
```

---

## 8.6 Servidor inacessível na rede

**Sintoma:** nenhum usuário consegue acessar; ping não responde.

1. Verificar fisicamente se o servidor está ligado e com LEDs ativos
2. Verificar cabo de rede
3. Acessar diretamente por console (teclado + monitor)
4. Verificar se UFW não bloqueou acessos indevidamente:
   ```bash
   sudo ufw status verbose
   ```
5. Verificar se IP mudou:
   ```bash
   ip addr show
   ```
```

- [ ] **Step 2: Escrever docs/pop/09-seguranca.md**

```markdown
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
```

- [ ] **Step 3: Escrever docs/pop/10-historico-revisoes.md**

```markdown
# 10 — Histórico de Revisões
**Elaborado por:** TI — Laboratório Sobral

---

| Versão | Data | Descrição | Autor |
|---|---|---|---|
| 1.0 | 2026-04-13 | Criação inicial do POP completo | TI — Laboratório Sobral |

---

> Todas as revisões subsequentes devem ser registradas nesta tabela com versão, data, descrição da alteração e responsável.
```

- [ ] **Step 4: Commit**

```bash
git add docs/pop/08-resolucao-problemas.md docs/pop/09-seguranca.md docs/pop/10-historico-revisoes.md
git commit -m "docs(pop): adiciona resolução de problemas, segurança e histórico de revisões"
```

---

## Task 8: Blueprint — Visão Geral, Hardware e Serviços

**Files:**
- Create: `docs/blueprint/01-visao-geral.md`
- Create: `docs/blueprint/02-hardware-storage.md`
- Create: `docs/blueprint/03-servicos.md`

- [ ] **Step 1: Escrever docs/blueprint/01-visao-geral.md**

```markdown
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
```

- [ ] **Step 2: Escrever docs/blueprint/02-hardware-storage.md**

```markdown
# 2 — Hardware e Storage
**Última atualização:** 2026-04-13

---

## 2.1 Discos

| Dispositivo | Tipo | Capacidade | Mount Point | Uso |
|---|---|---|---|---|
| sdb | SSD | 953 GB | `/` e `/srv/samba` | OS + compartilhamentos críticos (12 deptos) |
| sdc | HDD | 465 GB | `/mnt/hdd/samba` | Compartilhamentos secundários (6 deptos) |
| sda | HDD | 465 GB | `/mnt/hdd2/backups` | Backup incremental diário (rsync) |
| sdd | HDD | 465 GB | `/mnt/hdd3` | Snapshot semanal / reserva / importação |

**Capacidade total:** ~2,3 TB  
**Capacidade em produção (shares):** ~1,4 TB  
**Capacidade de backup local:** ~465 GB

## 2.2 Layout de Partições

```
sdb (SSD 953GB)
├── /             → sistema operacional Ubuntu
└── /srv/samba    → 12 compartilhamentos (deptos críticos)

sdc (HDD 465GB)
└── /mnt/hdd      → 6 compartilhamentos (deptos secundários)
    └── /mnt/hdd/samba/

sda (HDD 465GB)
└── /mnt/hdd2
    └── /mnt/hdd2/backups/  → destino do rsync diário

sdd (HDD 465GB)
└── /mnt/hdd3               → snapshots / reserva
```

## 2.3 Verificação de Saúde dos Discos

```bash
# Uso atual
df -h | grep -E '/$|/mnt/'

# Status S.M.A.R.T (requer smartmontools)
sudo smartctl -a /dev/sdb
sudo smartctl -a /dev/sdc
sudo smartctl -a /dev/sda
sudo smartctl -a /dev/sdd

# I/O em tempo real
iostat -x 1 3
```
```

- [ ] **Step 3: Escrever docs/blueprint/03-servicos.md**

```markdown
# 3 — Serviços e Processos
**Última atualização:** 2026-04-13

---

## 3.1 Samba 4.x

| Campo | Detalhe |
|---|---|
| **Função** | Compartilhamento de arquivos via SMB para clientes Windows |
| **Versão** | Samba 4.x |
| **Configuração** | `/etc/samba/smb.conf` (versionado em `config/smb.conf`) |
| **Unidades systemd** | `smbd` (daemon principal), `nmbd` (resolução de nomes NetBIOS) |
| **Portas** | 445/TCP (SMB), 139/TCP (NetBIOS) |
| **Compartilhamentos** | 19 shares (ver módulo 04) |

```bash
sudo systemctl status smbd nmbd
testparm -s              # validar configuração
```

## 3.2 SSSD (System Security Services Daemon)

| Campo | Detalhe |
|---|---|
| **Função** | Autenticação de usuários do AD no servidor Linux |
| **Configuração** | `/etc/sssd/sssd.conf` (permissão 600 obrigatória) |
| **Domínio** | labsobralnet.ind |
| **AD Server** | 192.86.221.218 (Windows Server 2012) |
| **Unidade systemd** | `sssd` |

```bash
sudo systemctl status sssd
id usuario@labsobralnet.ind   # testar autenticação AD
```

## 3.3 UFW (Uncomplicated Firewall)

| Campo | Detalhe |
|---|---|
| **Função** | Firewall host — controle de acesso por porta/IP |
| **Configuração** | `ufw-rules.sh` (versionado) |
| **Portas liberadas** | 22, 139, 445, 8080 — apenas 192.86.221.0/24 |

```bash
sudo ufw status verbose
```

## 3.4 rsync

| Campo | Detalhe |
|---|---|
| **Função** | Backup incremental local diário |
| **Script** | `scripts/backup-labsrv.sh` |
| **Agendamento** | Cron: todo dia às 23h00 |
| **Origem** | `/srv/samba/`, `/mnt/hdd/samba/` |
| **Destino** | `/mnt/hdd2/backups/` |
| **Log** | `/var/log/backup-labsrv.log` |

## 3.5 rclone

| Campo | Detalhe |
|---|---|
| **Versão** | 1.73.4 |
| **Função** | Backup/migração para Google Drive |
| **Remote** | `gdrive-labsobral` → Shared Drive `BACKUP_SERVIDOR` |
| **Conta** | suporte@laboratoriosobral.com |
| **Log** | `/var/log/rclone-backup.log` |

## 3.6 labsrv-panel (Painel Web)

| Campo | Detalhe |
|---|---|
| **Função** | Interface web de administração |
| **Stack** | Python 3.10 + FastAPI + HTML/CSS/JS puro |
| **Porta** | 8080 |
| **Unidade systemd** | `labsrv-panel` |
| **Código-fonte** | `panel/` (no repositório) |

```bash
sudo systemctl status labsrv-panel
```

## 3.7 Tarefas Agendadas (cron)

```bash
crontab -l   # ver crons do usuário admin
```

| Horário | Tarefa |
|---|---|
| 23h00 diário | Backup rsync local |
| */15 * * * * | Watchdog de migração GDrive (temporário) |
```

- [ ] **Step 4: Commit**

```bash
git add docs/blueprint/01-visao-geral.md docs/blueprint/02-hardware-storage.md docs/blueprint/03-servicos.md
git commit -m "docs(blueprint): adiciona visão geral, hardware e serviços"
```

---

## Task 9: Blueprint — Compartilhamentos, AD e Rede

**Files:**
- Create: `docs/blueprint/04-compartilhamentos.md`
- Create: `docs/blueprint/05-autenticacao-ad.md`
- Create: `docs/blueprint/06-rede-firewall.md`

- [ ] **Step 1: Escrever docs/blueprint/04-compartilhamentos.md**

```markdown
# 4 — Compartilhamentos Samba
**Última atualização:** 2026-04-13

---

## 4.1 Lista de Compartilhamentos

| # | Share | Caminho no servidor | Grupo AD | Disco |
|---|---|---|---|---|
| 1 | DEPARTAMENTO_TECNICO | /srv/samba/DEPARTAMENTO_TECNICO | LABSOBRALNET\SISTEMA DA QUALIDADE | sdb |
| 2 | CONTABILIDADE | /srv/samba/CONTABILIDADE | LABSOBRALNET\CONTABILIDADE | sdb |
| 3 | FISCAL | /srv/samba/FISCAL | LABSOBRALNET\CONTABILIDADE | sdb |
| 4 | CONTROLADORIA | /srv/samba/CONTROLADORIA | LABSOBRALNET\CONTROLADORIA | sdb |
| 5 | FINANCEIRO | /srv/samba/FINANCEIRO | LABSOBRALNET\FINANCEIRO | sdb |
| 6 | RECURSOS_HUMANOS | /srv/samba/RECURSOS_HUMANOS | LABSOBRALNET\RECURSOS HUMANOS | sdb |
| 7 | COMERCIAL_VENDAS | /srv/samba/COMERCIAL_VENDAS | usuários locais (comercial1/2/3) | sdb |
| 8 | INDUSTRIAL | /srv/samba/INDUSTRIAL | LABSOBRALNET\INDUSTRIAL | sdb |
| 9 | SUPRIMENTOS | /srv/samba/SUPRIMENTOS | LABSOBRALNET\PCP | sdb |
| 10 | MANUTENCAO | /srv/samba/MANUTENCAO | LABSOBRALNET\MANUTENÇÃO | sdb |
| 11 | LOGISTICA_RECEBIMENTO | /srv/samba/LOGISTICA_RECEBIMENTO | LABSOBRALNET\LOGISTICA | sdb |
| 12 | LOGISTICA_EXPEDICAO | /srv/samba/LOGISTICA_EXPEDICAO | LABSOBRALNET\LOGISTICA | sdb |
| 13 | MARKETING | /mnt/hdd/samba/MARKETING | LABSOBRALNET\MARKETING | sdc |
| 14 | SEGURANCA_TRABALHO | /mnt/hdd/samba/SEGURANCA_TRABALHO | LABSOBRALNET\SESMT | sdc |
| 15 | SERVICOS_GERAIS | /mnt/hdd/samba/SERVICOS_GERAIS | LABSOBRALNET\SERVICOS GERAIS | sdc |
| 16 | DIRETORIAS | /mnt/hdd/samba/DIRETORIAS | LABSOBRALNET\PRESIDENCIA | sdc |
| 17 | SECRETARIA | /mnt/hdd/samba/SECRETARIA | LABSOBRALNET\SECRETARIA | sdc |
| 18 | TI | /mnt/hdd/samba/TI | LABSOBRALNET\Administradores | sdc |
| 19 | LINKS_UTEIS | /mnt/hdd/samba/MARKETING/LINKS_UTEIS | usuário local (vendedores) | sdc |

**Total:** 19 compartilhamentos — 12 no SSD (sdb), 7 no HDD (sdc)

## 4.2 Convenções de Permissão

- Permissão de diretório: `0770` (dono: root, grupo: grupo Linux do depto)
- Grupos Linux mapeados para grupos AD via SSSD
- Escrita habilitada para todos os membros do grupo

## 4.3 Comandos Úteis

```bash
# Listar shares ativos
testparm -s | grep '\['

# Ver conexões por share
sudo smbstatus -S

# Verificar permissões de diretório
ls -la /srv/samba/
ls -la /mnt/hdd/samba/
```
```

- [ ] **Step 2: Escrever docs/blueprint/05-autenticacao-ad.md**

```markdown
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
```

- [ ] **Step 3: Escrever docs/blueprint/06-rede-firewall.md**

```markdown
# 6 — Rede e Firewall
**Última atualização:** 2026-04-13

---

## 6.1 Endereçamento

| Componente | IP | Função |
|---|---|---|
| LABSRVFILES | 192.86.221.213 | Servidor de arquivos |
| AD / DNS | 192.86.221.218 | Active Directory + DNS primário |
| pfSense | (gateway da rede) | Firewall de perímetro |
| Rede corporativa | 192.86.221.0/24 | Subnet interna |

## 6.2 Portas do Servidor

| Porta | Protocolo | Serviço | Origem permitida |
|---|---|---|---|
| 22 | TCP | SSH | 192.86.221.0/24 |
| 139 | TCP | SMB / NetBIOS Session | 192.86.221.0/24 |
| 445 | TCP | SMB direto | 192.86.221.0/24 |
| 8080 | TCP | Painel Web (labsrv-panel) | 192.86.221.0/24 |

Nenhuma porta está exposta externamente. O pfSense bloqueia todo tráfego externo ao servidor.

## 6.3 UFW — Firewall Host

```bash
# Ver regras ativas
sudo ufw status verbose

# Aplicar regras do repositório
sudo bash ~/labsrvfiles/ufw-rules.sh

# Adicionar nova regra (exemplo)
sudo ufw allow from 192.86.221.0/24 to any port 8080 proto tcp
```

## 6.4 pfSense

Firewall de perímetro gerenciado separadamente. Responsável por:
- Bloquear todo tráfego externo ao servidor de arquivos
- NAT da rede interna
- VPN (se configurada)

Acesso ao pfSense: consultar equipe de TI (fora do escopo deste repositório).

## 6.5 DNS

```bash
# Verificar resolução DNS
nslookup labsobralnet.ind
nslookup LABSRVFILES.labsobralnet.ind

# Verificar configuração de DNS do servidor
cat /etc/resolv.conf
```
```

- [ ] **Step 4: Commit**

```bash
git add docs/blueprint/04-compartilhamentos.md docs/blueprint/05-autenticacao-ad.md docs/blueprint/06-rede-firewall.md
git commit -m "docs(blueprint): adiciona compartilhamentos, autenticação AD e rede"
```

---

## Task 10: Blueprint — Backup, Painel Web, Segurança e Migração

**Files:**
- Create: `docs/blueprint/07-backup-recuperacao.md`
- Create: `docs/blueprint/08-painel-web.md`
- Create: `docs/blueprint/09-seguranca.md`
- Create: `docs/blueprint/10-migracao-gdrive.md`

- [ ] **Step 1: Escrever docs/blueprint/07-backup-recuperacao.md**

```markdown
# 7 — Backup e Recuperação
**Última atualização:** 2026-04-13

---

## 7.1 Estratégia

O sistema adota backup em duas camadas:

| Camada | Ferramenta | Frequência | Destino | Retenção |
|---|---|---|---|---|
| Local incremental | rsync | Diária (23h) | /mnt/hdd2/backups (sda) | Contínua (sobrescreve o anterior) |
| Nuvem | rclone | Configurável | Google Drive (BACKUP_SERVIDOR) | Definida pelo Google Drive |

## 7.2 Backup Local (rsync)

**Script:** `scripts/backup-labsrv.sh`

**Cron:** `0 23 * * * /home/admin/labsrvfiles/scripts/backup-labsrv.sh`

**Origem → Destino:**
- `/srv/samba/` → `/mnt/hdd2/backups/srv/samba/`
- `/mnt/hdd/samba/` → `/mnt/hdd2/backups/mnt/hdd/samba/`

**Log:** `/var/log/backup-labsrv.log`

**Flags rsync utilizadas:**
- `--archive` — preserva permissões, timestamps, links simbólicos
- `--delete` — remove do destino arquivos deletados na origem
- `--compress` — comprime durante transferência

## 7.3 Backup em Nuvem (rclone)

**Remote configurado:** `gdrive-labsobral`
**Destino:** Shared Drive `BACKUP_SERVIDOR`
**Conta:** suporte@laboratoriosobral.com
**Config:** `~/.config/rclone/rclone.conf` (não versionado — contém tokens)

```bash
# Verificar remote configurado
rclone listremotes

# Testar conexão
rclone lsd gdrive-labsobral:

# Executar backup manual
rclone sync /srv/samba/ gdrive-labsobral:BACKUP_SERVIDOR/srv/samba/ \
  --progress --log-file=/var/log/rclone-backup.log
```

## 7.4 Recuperação de Dados

### Arquivo individual
```bash
sudo cp /mnt/hdd2/backups/srv/samba/DEPTO/arquivo.ext \
        /srv/samba/DEPTO/arquivo.ext
```

### Pasta completa
```bash
sudo rsync -av /mnt/hdd2/backups/srv/samba/DEPTO/ /srv/samba/DEPTO/
```

### Verificar integridade pós-restauração
```bash
ls -la /srv/samba/DEPTO/
stat /srv/samba/DEPTO/arquivo.ext
```
```

- [ ] **Step 2: Escrever docs/blueprint/08-painel-web.md**

```markdown
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
```

- [ ] **Step 3: Escrever docs/blueprint/09-seguranca.md**

```markdown
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
```

- [ ] **Step 4: Escrever docs/blueprint/10-migracao-gdrive.md**

```markdown
# 10 — Migração Google Drive `[TEMPORÁRIO]`

> ⚠️ **Este módulo descreve um processo temporário em andamento.**
> Será removido do Blueprint após a conclusão da migração.
> **Não incluir no POP.**

**Última atualização:** 2026-04-13

---

## 10.1 Objetivo

Migrar o conteúdo de todos os Shared Drives do Google Drive da empresa para o servidor local (`/mnt/hdd3/gdrive_import/`), como parte da estratégia de consolidação do armazenamento no LABSRVFILES.

## 10.2 Estado Atual

- **Drives a migrar:** 43 Shared Drives
- **Destino:** `/mnt/hdd3/gdrive_import/` (disco sdd — 465GB)
- **Status:** em andamento (iniciado em abril de 2026)
- **PID ativo:** monitorado pelo watchdog

## 10.3 Ferramentas

| Ferramenta | Versão | Função |
|---|---|---|
| rclone | 1.73.4 | Cópia dos Shared Drives para o servidor |
| migrate-gdrive-all.sh | — | Script orquestrador da migração |
| migrate-watchdog.sh | — | Watchdog com reinício automático em caso de travamento |

## 10.4 Scripts

**Migração:** `scripts/migrate-gdrive-all.sh`
- Itera pelos 43 drives em sequência
- Retomável: pula drives já marcados como `CONCLUÍDO` no log
- Flags: `--tpslimit 2`, `--drive-pacer-min-sleep 200ms`, `--stats 30s`

**Watchdog:** `scripts/migrate-watchdog.sh`
- Executa via cron a cada 15 minutos
- Reinicia a migração se o log ficar sem atualização por 60 minutos
- Registra as últimas 20 linhas do log de migração antes de reiniciar

## 10.5 Logs e Monitoramento

```bash
# Progresso da migração
tail -f ~/migrate-gdrive.log

# Log do watchdog
tail -f /var/log/migrate-watchdog.log

# Processo ativo
pgrep -a -f migrate-gdrive-all.sh
```

## 10.6 Problemas Conhecidos

| Problema | Causa | Mitigação |
|---|---|---|
| Travamentos periódicos | `rateLimitExceeded` da API Google | Watchdog reinicia automaticamente; `--tpslimit 2` reduz pressão |
| Arquivo corrompido | Arquivo aberto no Drive durante upload original | `--ignore-errors` pula e continua |
```

- [ ] **Step 5: Commit**

```bash
git add docs/blueprint/07-backup-recuperacao.md docs/blueprint/08-painel-web.md docs/blueprint/09-seguranca.md docs/blueprint/10-migracao-gdrive.md
git commit -m "docs(blueprint): adiciona backup, painel web, segurança e migração GDrive"
```

---

## Task 11: Manual de Usuários

**Files:**
- Create: `docs/manual-usuarios/01-introducao.md`
- Create: `docs/manual-usuarios/02-acesso-windows.md`
- Create: `docs/manual-usuarios/03-uso-compartilhamentos.md`
- Create: `docs/manual-usuarios/04-problemas-comuns.md`
- Create: `docs/manual-usuarios/05-suporte.md`

- [ ] **Step 1: Escrever docs/manual-usuarios/01-introducao.md**

```markdown
# 1 — Introdução
**Manual de Uso — Servidor de Arquivos**
**Laboratório Sobral**

---

## O que é o Servidor de Arquivos?

O servidor de arquivos é um computador da empresa dedicado a **guardar e compartilhar documentos** entre os colaboradores. Pense nele como um "HD externo gigante" que fica na rede — todos com permissão podem acessar, salvar e abrir arquivos diretamente por ele, sem precisar enviar por e-mail ou usar pen drive.

## Por que usar o servidor?

- **Segurança:** seus arquivos ficam armazenados em equipamento da empresa, com backup automático todo dia
- **Acesso compartilhado:** todos do seu departamento acessam os mesmos arquivos, sem precisar copiar de um para o outro
- **Organização:** cada departamento tem sua própria pasta, separada das demais
- **Rastreabilidade:** a TI consegue identificar quem acessou ou modificou cada arquivo quando necessário

## O que eu preciso para acessar?

- Computador conectado à rede da empresa
- Usuário e senha do domínio (os mesmos que você usa para entrar no Windows)
- Permissão para o seu departamento (concedida pela TI)
```

- [ ] **Step 2: Escrever docs/manual-usuarios/02-acesso-windows.md**

```markdown
# 2 — Como Acessar pelo Windows
**Manual de Uso — Servidor de Arquivos**
**Laboratório Sobral**

---

## Método 1: Acesso direto (mais simples)

1. Pressione as teclas **Win + R** ao mesmo tempo
   *(a tecla Win é a do logotipo do Windows no teclado)*
2. Na janela que abrir, digite exatamente:
   ```
   \\192.86.221.213
   ```
3. Pressione **Enter**
4. Se solicitado, digite seu **usuário** e **senha do domínio**
   - Usuário: `labsobralnet\seu.nome` ou apenas `seu.nome`
   - Senha: a mesma que você usa para entrar no Windows
5. Você verá as pastas dos departamentos que você tem acesso

## Método 2: Mapear como unidade de rede (recomendado)

Mapear cria uma "letra de unidade" (como `Z:`) no seu computador, facilitando o acesso diário.

1. Abra o **Explorador de Arquivos** (a pasta amarela na barra de tarefas)
2. Clique em **Este Computador** no painel esquerdo
3. No menu superior, clique em **Computador** → **Mapear unidade de rede**
4. Escolha uma letra (ex: `Z:`)
5. No campo **Pasta**, digite:
   ```
   \\192.86.221.213\NOME_DO_SEU_DEPARTAMENTO
   ```
   Exemplo para o departamento Financeiro:
   ```
   \\192.86.221.213\FINANCEIRO
   ```
6. Marque a opção **Reconectar ao entrar**
7. Clique em **Concluir**
8. Digite suas credenciais se solicitado

A partir de agora, o compartilhamento aparecerá como uma unidade no Explorador de Arquivos.

## Nomes dos compartilhamentos por departamento

| Departamento | Nome para usar no endereço |
|---|---|
| Sistema da Qualidade / Técnico | DEPARTAMENTO_TECNICO |
| Contabilidade | CONTABILIDADE |
| Fiscal | FISCAL |
| Controladoria | CONTROLADORIA |
| Financeiro | FINANCEIRO |
| Recursos Humanos | RECURSOS_HUMANOS |
| Industrial | INDUSTRIAL |
| Suprimentos / PCP | SUPRIMENTOS |
| Manutenção | MANUTENCAO |
| Logística Recebimento | LOGISTICA_RECEBIMENTO |
| Logística Expedição | LOGISTICA_EXPEDICAO |
| Marketing | MARKETING |
| Segurança do Trabalho | SEGURANCA_TRABALHO |
| Serviços Gerais | SERVICOS_GERAIS |
| Diretorias | DIRETORIAS |
| Secretaria | SECRETARIA |
| TI | TI |
```

- [ ] **Step 3: Escrever docs/manual-usuarios/03-uso-compartilhamentos.md**

```markdown
# 3 — Como Usar os Compartilhamentos
**Manual de Uso — Servidor de Arquivos**
**Laboratório Sobral**

---

## Abrindo arquivos

Abra arquivos diretamente do servidor — não é necessário copiar para o computador primeiro. Clique duas vezes no arquivo normalmente.

**Atenção:** se outra pessoa abrir o mesmo arquivo ao mesmo tempo, pode ocorrer conflito. Combine com a equipe quem está editando.

## Salvando arquivos

Salve seus documentos diretamente na pasta do seu departamento no servidor. Isso garante que o arquivo fique no backup automático.

**Não salve arquivos importantes apenas no Desktop ou em "Meus Documentos"** — esses locais não têm backup automático.

## Organizando arquivos

- Use pastas com nomes claros e descritivos
- Prefira datas no formato `AAAA-MM-DD` quando relevante (ex: `2026-04-13_Relatorio.docx`)
- Não crie duplicatas desnecessárias — combine com a equipe um local padrão para cada tipo de documento

## O que NÃO fazer

- Não armazene **arquivos pessoais** (fotos de família, músicas, vídeos pessoais) no servidor
- Não armazene **arquivos muito grandes e desnecessários** (instaladores, backups pessoais)
- Não tente acessar as pastas de outros departamentos
- Não compartilhe sua senha com colegas — cada um deve usar seu próprio login
- Não delete arquivos de outros colegas sem combinação prévia

## Compartilhar um arquivo com um colega

Se precisar compartilhar um arquivo com um colega do mesmo departamento, basta informar o caminho no servidor:

> "O arquivo está em `\\192.86.221.213\FINANCEIRO\Relatórios\2026`"

Se precisar compartilhar com alguém de outro departamento, consulte o TI.
```

- [ ] **Step 4: Escrever docs/manual-usuarios/04-problemas-comuns.md**

```markdown
# 4 — Problemas Comuns
**Manual de Uso — Servidor de Arquivos**
**Laboratório Sobral**

---

## "Não consigo acessar o servidor"

**O endereço `\\192.86.221.213` não abre ou dá erro de rede.**

Verifique:
1. Você está conectado à rede da empresa? (cabo de rede ou Wi-Fi corporativo)
2. O computador está no domínio `labsobralnet.ind`?

Se sim para ambos, entre em contato com o TI.

---

## "Peço a senha mas não aceita"

**Digite usuário e senha mas aparece "Acesso negado" ou "Senha incorreta".**

Possíveis causas:
- Senha expirou no domínio → tente fazer logoff e logon no Windows. Se não funcionar, solicite reset ao TI
- Está digitando o usuário no formato errado → tente `labsobralnet\seu.usuario`
- Sua conta pode ter sido bloqueada → entre em contato com o TI

---

## "Não vejo minha pasta de departamento"

**O servidor abre mas a pasta do meu departamento não aparece.**

Isso indica que você ainda não tem permissão configurada. Entre em contato com o TI informando:
- Seu nome completo
- Seu departamento
- Seu nome de usuário no Windows

---

## "Não consigo salvar / criar arquivos"

**Consigo ver os arquivos mas não editar ou criar novos.**

Possíveis causas:
- Você tem permissão apenas de leitura naquela pasta
- O arquivo está aberto por outro usuário (verifique se há um arquivo `.lck` com o mesmo nome)
- O disco do servidor pode estar cheio → informe o TI

---

## "O arquivo que eu abri está em branco ou corrompido"

1. Feche o arquivo
2. Verifique se há uma versão recente no backup (consulte o TI)
3. Não salve sobre o arquivo corrompido — aguarde orientação do TI

---

## "Perdi um arquivo / arquivo foi deletado"

Entre em contato com o TI **imediatamente**, informando:
- Nome exato do arquivo
- Pasta onde estava
- Data aproximada em que ainda existia

O TI pode restaurar do backup se a solicitação for feita rapidamente.
```

- [ ] **Step 5: Escrever docs/manual-usuarios/05-suporte.md**

```markdown
# 5 — Suporte
**Manual de Uso — Servidor de Arquivos**
**Laboratório Sobral**

---

## Quando acionar o TI?

- Não consegue acessar o servidor
- Senha não funciona ou conta bloqueada
- Arquivo deletado ou corrompido
- Precisa de acesso a um novo compartilhamento
- Qualquer comportamento anormal no servidor

## Como acionar o TI?

| Canal | Contato |
|---|---|
| E-mail | suporte@laboratoriosobral.com |
| Acesso direto | Sala de TI |

**Ao entrar em contato, informe:**
- Seu nome e departamento
- O que estava tentando fazer
- A mensagem de erro que apareceu (se houver)
- Desde quando o problema ocorre

## Informações Úteis

| Campo | Valor |
|---|---|
| Endereço do servidor | `\\192.86.221.213` |
| IP do servidor | 192.86.221.213 |
| Painel (apenas TI) | http://192.86.221.213:8080 |
```

- [ ] **Step 6: Commit**

```bash
git add docs/manual-usuarios/
git commit -m "docs(manual): adiciona manual completo de usuários"
```

---

## Task 12: Atualizar CLAUDE.md e README.md

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Atualizar seção de leitura obrigatória no CLAUDE.md**

Em `CLAUDE.md`, atualizar o item 2 da seção "LEITURA OBRIGATÓRIA":

```markdown
2. `tasks/TASKS_PENDENTES.md` — estado atual, pendências e features planejadas
3. `docs/Blueprint_Tecnico.md` — índice da arquitetura completa (módulos em `docs/blueprint/`)
4. O arquivo de config relevante para a tarefa em `config/`
```

- [ ] **Step 2: Adicionar seção do painel ao CLAUDE.md**

Adicionar nova seção após a seção 3 (ARQUITETURA RESUMIDA):

```markdown
## 3a. PAINEL DE ADMINISTRAÇÃO WEB

- **URL:** http://192.86.221.213:8080
- **Serviço systemd:** `labsrv-panel`
- **Código-fonte:** `panel/` (no repositório)
- **Stack:** Python 3.10 + FastAPI + HTML/CSS/JS puro
- **Auth:** PAM + JWT — credenciais do domínio AD
- **Acesso:** grupo AD `LABSOBRALNET\Administradores`
- **Roles:** `panel/roles.json` (Super Admin / Operador / Somente Leitura)
- **Design spec:** `docs/superpowers/specs/2026-04-12-admin-panel-design.md`

### Gerenciar serviço:
```bash
sudo systemctl status labsrv-panel
sudo systemctl restart labsrv-panel
journalctl -u labsrv-panel -n 50
```
```

- [ ] **Step 3: Atualizar seção 7 (TAREFAS ATIVAS) do CLAUDE.md**

Atualizar referência de docs:

```markdown
## 7. TAREFAS ATIVAS

Consulte sempre `tasks/TASKS_PENDENTES.md` para o estado atual.
Tarefas em andamento devem ser marcadas com `[WIP]`.
Tarefas concluídas devem ser movidas para a seção `CONCLUÍDO`.

## 7a. DOCUMENTAÇÃO

| Documento | Índice | Módulos |
|---|---|---|
| POP | `docs/POP.md` | `docs/pop/` (10 módulos) |
| Blueprint Técnico | `docs/Blueprint_Tecnico.md` | `docs/blueprint/` (10 módulos) |
| Manual de Usuários | `docs/Manual_de_Uso.md` | `docs/manual-usuarios/` (5 módulos) |
```

- [ ] **Step 4: Atualizar README.md**

Atualizar a seção "Estrutura do Repositório" para refletir `panel/` e nova estrutura de docs:

```markdown
## Estrutura do Repositório

```
labsrvfiles/
├── config/
│   ├── smb.conf           # Configuração do Samba
│   └── sssd.conf          # Configuração do SSSD (AD auth)
├── scripts/
│   ├── backup-labsrv.sh   # Backup incremental rsync
│   ├── migrate-gdrive-all.sh  # Migração Google Drive [TEMPORÁRIO]
│   ├── migrate-watchdog.sh    # Watchdog da migração [TEMPORÁRIO]
│   └── delta-sync.sh      # Pré-cutover delta sync
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
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: atualiza CLAUDE.md e README com painel e nova estrutura de docs"
```

---

## Task 13: Push e sync final

**Files:** nenhum (operação git)

- [ ] **Step 1: Push para o GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Pull no servidor**

```bash
ssh -t admin@192.86.221.213 "git -C ~/labsrvfiles pull origin main"
```

- [ ] **Step 3: Verificar estrutura no servidor**

```bash
ssh admin@192.86.221.213 "find ~/labsrvfiles/docs -name '*.md' | sort"
```

Resultado esperado: todos os 25 novos arquivos de documentação presentes.
