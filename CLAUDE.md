# CLAUDE.md — Instruções para o Claude Code

> Este arquivo orienta o Claude Code (CLI no VS Code) na construção do **SBRChecks**.
> Leia-o antes de qualquer tarefa. Mantenha-o atualizado conforme o projeto evolui.

## O que é o SBRChecks

Sistema interno de gestão de visitas a PDVs (pontos de venda) para a **equipe de
vendedores internos do Laboratório Sobral**. Inspirado no "Minha Visita".

- **Não é um produto comercial** vendido a terceiros: é uso interno.
- Hospedado em `sbrchecks.laboratoriosobral.com.br` (subdomínio do domínio existente).
- Roda em **VPS Hostinger**, 100% **dockerizado**.

## Os dois usuários do sistema

1. **Vendedor (mobile / PWA):** faz check-in e check-out nos PDVs, preenche
   checklist, tira foto, registra a visita. Usa quase sempre o celular, muitas
   vezes com internet instável → **offline-first é obrigatório**.
2. **Gerente (painel web):** acompanha visitas em tempo real, vê mapa de
   vendedores, relatórios, KM rodado, indicadores. Usa desktop.

## Funcionalidade central: check-in / check-out

- **Semi-automático com confirmação de 1 toque.** Quando o vendedor (com o PWA
  aberto, em rota) entra no raio de um PDV, o app detecta e exibe um card:
  "Você chegou em [PDV] — confirmar check-in?". Um toque confirma.
- Check-out: mesma lógica ao se afastar do raio, ou manual.
- **NÃO tente check-in 100% automático com app fechado.** É tecnicamente
  impossível em PWA (service workers não acessam geolocalização; geofencing em
  background não existe na web). Não perca tempo nisso.
- Sempre registrar: timestamp, lat/long, precisão do GPS, e se foi confirmado
  manual ou via detecção de proximidade.

## Princípios de arquitetura (NÃO violar)

1. **Offline-first.** O vendedor grava local (IndexedDB) e uma fila de
   sincronização sobe para a API quando há rede. A UI nunca trava esperando rede.
2. **Idempotência.** Toda escrita do cliente carrega um `client_uuid` para que
   reenvios na sincronização não dupliquem registros.
3. **Mobile-first de verdade.** Telas pensadas para uso com uma mão, em pé, na
   rua. Botões grandes. Mínimo de digitação.
4. **Um só ecossistema TypeScript** do front ao back.
5. **Tudo em container.** Nada roda fora do Docker Compose. Nenhum passo de
   deploy é manual fora do que está versionado.

## Stack

- **Frontend (PWA):** React + Vite + TypeScript. Service Worker via `vite-plugin-pwa`
  (Workbox). Estado offline em IndexedDB (usar `dexie`).
- **Backend (API):** Node + Fastify + TypeScript.
- **Banco:** PostgreSQL (container, volume persistente).
- **Storage de fotos:** MinIO (S3-compatível, self-hosted). Fotos NUNCA no Postgres.
- **Reverse proxy / HTTPS:** Caddy (TLS automático via Let's Encrypt).
- **ORM:** Prisma (migrations versionadas).
- **Mapas:** MapLibre GL + tiles (definir provedor; começar com OpenStreetMap).
- **CI/CD:** GitHub Actions → build de imagens → deploy no VPS.

## Estrutura de pastas

```
sbrchecks/
├─ CLAUDE.md                  # este arquivo
├─ README.md                  # visão geral e setup
├─ docker-compose.yml         # orquestração de produção
├─ docker-compose.dev.yml     # ambiente local
├─ .env.example               # variáveis (NUNCA commitar .env real)
├─ Caddyfile                  # config do reverse proxy
├─ apps/
│  ├─ web/                    # PWA do vendedor + painel do gerente
│  │  ├─ Dockerfile
│  │  └─ src/
│  └─ api/                    # Fastify
│     ├─ Dockerfile
│     └─ src/
├─ packages/
│  └─ shared/                 # tipos e schemas compartilhados (zod)
└─ db/
   └─ prisma/                 # schema.prisma + migrations
```

## Regras de codificação

- TypeScript estrito (`strict: true`). Sem `any` sem justificativa.
- Validação de entrada na API com **zod**; reutilizar os schemas no front.
- Toda rota da API autenticada (JWT). Vendedor e gerente têm papéis distintos (RBAC).
- Datas sempre em UTC no banco; converter na exibição.
- Nunca logar dados sensíveis (token, senha, localização crua de usuário) em texto.
- Commits pequenos e descritivos. Uma feature por branch.

## Ordem de construção (seguir os sprints do README)

Não pule etapas. O fundamento (auth + offline + check-in) tem que estar sólido
antes de relatórios e BI. Sempre rodar `docker-compose -f docker-compose.dev.yml up`
e validar localmente antes de abrir PR.

## Acervo de skills: agnostic-core

Este projeto se apoia no acervo **agnostic-core** — um catálogo de boas práticas
em Markdown (skills, agents e workflows). Repo: `paulinett1508-dev/agnostic-core`.

**Como usar:** antes de executar uma tarefa de um sprint, consulte a skill
correspondente abaixo e aplique o que fizer sentido ao contexto. Não copie os
arquivos para dentro deste repo — leia e adapte. O acervo serve à decisão; o
SBRChecks nunca se curva a ele cegamente.

Opção recomendada de acesso: clonar o agnostic-core em paralelo
(`../agnostic-core`) ou adicioná-lo como git submodule em `vendor/agnostic-core`,
para que a CLI possa abrir os arquivos diretamente.

### Mapa skill → sprint (curadoria para o SBRChecks)

| Tarefa / Sprint | Consultar antes |
|---|---|
| Modelar/alterar banco (S0, S2, S3) | `skills/database/` |
| Endpoints e contratos da API (S1–S4) | `skills/backend/`, `skills/security/` |
| Autenticação, RBAC, LGPD (S1, S7) | `skills/security/` (OWASP, hardening) |
| Telas mobile e painel (S3–S5) | `skills/ux-ui/`, `skills/frontend/` |
| Sync offline e relatórios (S3, S6) | `skills/cache/`, `skills/performance/` |
| Testes (todos os sprints) | `skills/testing/` |
| Deploy no VPS (S0, S7) | `skills/devops/`, `skills/automacao/` |
| Revisão e debugging (contínuo) | `skills/audit/` |

### Agents e workflows a invocar

- **Antes de criar uma feature:** workflow `commands/workflows/create.md`.
- **Ao caçar bug:** workflow `commands/workflows/debug.md`.
- **No deploy:** workflow `commands/workflows/deploy.md`.
- **Especialistas a incorporar conforme a tarefa:**
  `agents/specialists/mobile-developer.md`,
  `agents/specialists/database-architect.md`,
  `agents/specialists/devops-engineer.md`,
  `agents/reviewers/security-reviewer.md`.

### Atenção especial: LGPD

O SBRChecks registra **localização de pessoas** (vendedores) e dados de clientes
(PDVs). Antes de qualquer feature que grave ou exponha geolocalização, consultar
`skills/security/` e tratar isso como dado sensível: minimizar coleta, restringir
acesso por papel, e documentar retenção.

## Quando estiver em dúvida

- Prefira a solução mais simples que cumpra o requisito.
- Se uma escolha aumenta a superfície de manutenção, ela precisa se justificar.
- Pergunte antes de adicionar uma dependência pesada nova.
- Se uma skill do agnostic-core contradisser este CLAUDE.md, este arquivo vence —
  mas registre a divergência para revisão.
