# SBRChecks

Gestão de visitas a PDVs para a equipe de vendedores internos do **Laboratório Sobral**.
PWA mobile-first para o vendedor + painel web para o gerente. Offline-first, dockerizado, self-hosted.

---

## Arquitetura

```
                 sbrchecks.laboratoriosobral.com.br
                              │  (HTTPS)
                    ┌─────────▼──────────┐
                    │   Caddy (proxy)    │  TLS automático
                    └───┬───────────┬────┘
                        │           │
              /api/*    │           │   /* (PWA + painel)
                   ┌────▼────┐  ┌───▼─────┐
                   │   api   │  │   web   │
                   │ Fastify │  │  React  │
                   └────┬────┘  └─────────┘
                        │
            ┌───────────┼────────────┐
            │                        │
      ┌─────▼──────┐          ┌──────▼─────┐
      │ PostgreSQL │          │   MinIO    │
      │  (dados)   │          │  (fotos)   │
      └────────────┘          └────────────┘

   Tudo em containers, orquestrado por docker-compose no VPS Hostinger.
```

### Fluxo offline-first do vendedor

1. Vendedor abre o PWA no início da rota (instalado na tela inicial).
2. App carrega a carteira de PDVs do dia e guarda em IndexedDB.
3. Em rota, o app monitora a posição (em primeiro plano) e detecta chegada ao PDV.
4. Card de **check-in (1 toque)** aparece. Vendedor confirma, preenche checklist, tira foto.
5. Tudo grava **local primeiro**. Uma fila de sincronização envia para a API quando há rede.
6. Check-out ao sair do raio (ou manual). Mesma gravação offline + sync.

> Limitação consciente: não há check-in com o app fechado — a plataforma web não
> permite. A confirmação de 1 toque é, na prática, mais confiável (evita check-ins
> fantasma de quem só passou na frente do PDV).

---

## Stack

| Camada | Tecnologia |
|---|---|
| PWA + painel | React, Vite, TypeScript, vite-plugin-pwa (Workbox), Dexie (IndexedDB) |
| API | Node, Fastify, TypeScript, Zod, JWT |
| Banco | PostgreSQL + Prisma |
| Fotos | MinIO (S3-compatível) |
| Proxy/HTTPS | Caddy |
| Mapas | MapLibre GL + OpenStreetMap |
| Infra | Docker Compose, GitHub Actions |

---

## Roadmap por sprints

Construir **em ordem**. Cada sprint termina com algo funcional e testado localmente.

### Sprint 0 — Fundação
- Monorepo (apps/web, apps/api, packages/shared, db).
- docker-compose dev e prod; Caddyfile; .env.example.
- Postgres + Prisma com migration inicial vazia rodando.
- Esqueleto da API (healthcheck) e do PWA (tela em branco instalável).

### Sprint 1 — Autenticação e papéis
- Login (vendedor / gerente). JWT + refresh. RBAC.
- Cadastro de usuários pelo gerente.

### Sprint 2 — Cadastro de PDVs e carteira
- CRUD de PDVs (nome, endereço, lat/long, raio de geofence).
- Atribuição de PDVs a vendedores (carteira).
- Sincronização da carteira para o PWA (cache offline).

### Sprint 3 — Núcleo: check-in / check-out offline
- Detecção de proximidade em primeiro plano + card de confirmação de 1 toque.
- Gravação local (IndexedDB) com `client_uuid` (idempotência).
- Fila de sincronização → API. Registro de timestamp, geo, precisão, modo.

### Sprint 4 — Checklist e foto da visita
- Formulário de checklist configurável por tipo de visita.
- Captura de foto, compressão no cliente, upload para MinIO (com retry offline).

### Sprint 5 — Painel do gerente
- Mapa em tempo real dos vendedores e visitas do dia.
- Lista/filtros de visitas; detalhe da visita com fotos.

### Sprint 6 — Relatórios e indicadores
- KM rodado, visitas por vendedor/período, taxa de cobertura da carteira.
- Exportação (CSV).

### Sprint 7 — Polimento e produção
- Notificações push (agenda do dia, lembrete de PDV não visitado).
- Hardening de segurança, backup do Postgres, monitoramento.
- Deploy automatizado via GitHub Actions.

---

## Desenvolvimento local

```bash
cp .env.example .env       # preencher segredos locais
docker-compose -f docker-compose.dev.yml up --build
# PWA:    http://localhost:5173
# API:    http://localhost:3000
# MinIO:  http://localhost:9001
```

## Deploy (VPS Hostinger)

```bash
# no VPS, com Docker e Docker Compose instalados:
git pull
docker-compose up -d --build
# Caddy cuida do HTTPS automaticamente para o subdomínio.
```

> Apontar o DNS de `sbrchecks.laboratoriosobral.com.br` (registro A) para o IP do VPS.
