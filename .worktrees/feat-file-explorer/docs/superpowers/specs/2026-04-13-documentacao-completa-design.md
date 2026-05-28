# Documentação Completa LABSRVFILES — Design Spec
**Data:** 2026-04-13
**Status:** Aprovado

---

## 1. Visão Geral

Criação da documentação completa do sistema LABSRVFILES em estrutura modular. O objetivo é produzir três conjuntos de documentos independentes — POP, Blueprint Técnico e Manual de Usuários — cada um com audiência, tom e profundidade distintos, organizados em subpastas dentro de `docs/`.

Os arquivos raiz existentes (`POP.md`, `Blueprint_Tecnico.md`, `Manual_de_Uso.md`) são convertidos em **índices de navegação** que apontam para os módulos.

---

## 2. Audiências e Tom

| Documento | Audiência Principal | Tom |
|---|---|---|
| POP | Depto da Qualidade + qualquer colaborador | Formal, procedural, ISO-style |
| Blueprint | TI interna + auditores/fornecedores externos | Técnico, preciso, referencial |
| Manual de Usuários | Funcionários dos departamentos (sem conhecimento técnico) | Simples, direto, amigável |

---

## 3. Escopo

- **POP:** sistema estável apenas — Samba, backup, painel de administração, gestão de usuários, troubleshooting, segurança. **Sem migração Google Drive.**
- **Blueprint:** arquitetura atual completa. Migração Google Drive incluída como seção `[TEMPORÁRIO]`, com nota de que será removida após conclusão.
- **Manual de Usuários:** experiência do usuário final — acesso via Windows, uso dos compartilhamentos, problemas comuns, suporte.

---

## 4. Estrutura de Arquivos

```
docs/
├── pop/
│   ├── 01-objetivo-escopo.md
│   ├── 02-responsabilidades.md
│   ├── 03-glossario.md
│   ├── 04-operacao-diaria.md
│   ├── 05-gestao-usuarios.md
│   ├── 06-backup.md
│   ├── 07-painel-administracao.md
│   ├── 08-resolucao-problemas.md
│   ├── 09-seguranca.md
│   └── 10-historico-revisoes.md
│
├── blueprint/
│   ├── 01-visao-geral.md
│   ├── 02-hardware-storage.md
│   ├── 03-servicos.md
│   ├── 04-compartilhamentos.md
│   ├── 05-autenticacao-ad.md
│   ├── 06-rede-firewall.md
│   ├── 07-backup-recuperacao.md
│   ├── 08-painel-web.md
│   ├── 09-seguranca.md
│   └── 10-migracao-gdrive.md        # [TEMPORÁRIO]
│
├── manual-usuarios/
│   ├── 01-introducao.md
│   ├── 02-acesso-windows.md
│   ├── 03-uso-compartilhamentos.md
│   ├── 04-problemas-comuns.md
│   └── 05-suporte.md
│
├── Blueprint_Tecnico.md             # índice
├── POP.md                           # índice
└── Manual_de_Uso.md                 # índice
```

---

## 5. Formato do POP (ISO-style)

Cada módulo do POP segue a estrutura:

```
# [Número] — [Título]
**Versão:** 1.0
**Data:** YYYY-MM-DD
**Elaborado por:** TI — Laboratório Sobral

---
## Objetivo
## Escopo
## Responsabilidades
## Procedimento (passo a passo numerado)
## Registros / Evidências (quando aplicável)
```

O `10-historico-revisoes.md` consolida o histórico de todos os módulos.

---

## 6. Formato do Blueprint

Cada módulo é um documento de referência técnica:

```
# [Número] — [Título]
**Última atualização:** YYYY-MM-DD

---
## Descrição
## Componentes / Configuração
## Dependências
## Notas operacionais
```

Módulos `[TEMPORÁRIO]` carregam banner de aviso no topo.

---

## 7. Formato do Manual de Usuários

Tom simples, linguagem não técnica:

- Instruções numeradas passo a passo
- Sem jargão técnico
- Capturas de tela descritas textualmente (para posterior inserção de imagens)
- Seção de problemas comuns em formato pergunta/resposta

---

## 8. CLAUDE.md

Atualizar com:
- Seção sobre o painel de administração (`panel/`) e URL `http://192.86.221.213:8080`
- Referência à nova estrutura modular de docs
- Remoção das referências a arquivos `.docx` inexistentes no repo

---

## 9. O que NÃO está no escopo

- Criação de templates Word/PDF (o admin adapta o textual ao layout da empresa)
- Documentação de outros sistemas da empresa além do LABSRVFILES
- Documentação de procedimentos de migração no POP (temporário, fora do POP)

---

## 10. Critérios de Sucesso

- Todos os módulos escritos em português, tom adequado à audiência
- POP legível por alguém do depto da Qualidade sem conhecimento de TI
- Blueprint suficientemente detalhado para um técnico externo entender e dar manutenção ao sistema
- Manual de Usuários suficientemente simples para um funcionário de qualquer depto acessar o servidor sem ajuda
- CLAUDE.md reflete o estado real do sistema
