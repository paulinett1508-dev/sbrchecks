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
