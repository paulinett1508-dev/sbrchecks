# Sprint 0 — Fundação: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap o monorepo SBRChecks com api Fastify + PWA React funcionando localmente via docker-compose.dev.yml.

**Architecture:** Monorepo npm workspaces (apps/api, apps/web, packages/shared). API Fastify em TypeScript com Prisma apontando para `db/prisma/schema.prisma`. PWA React+Vite com vite-plugin-pwa e Dexie configurados. Tudo sobe via `docker-compose -f docker-compose.dev.yml up --build`.

**Tech Stack:** Node 20, TypeScript strict, Fastify 4, Prisma 5, React 18, Vite 5, vite-plugin-pwa (Workbox), Dexie 3, Zod 3, Docker Compose v2, PostgreSQL 16, MinIO.

---

## File Map

### Criar
- `package.json` — raiz, npm workspaces
- `.gitignore` — (substituir o `gitignore` existente sem dot)
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/index.ts`
- `apps/api/Dockerfile`
- `apps/api/.dockerignore`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/tsconfig.node.json`
- `apps/web/vite.config.ts`
- `apps/web/index.html`
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/db.ts`
- `apps/web/Dockerfile`
- `apps/web/nginx.conf`
- `docker-compose.dev.yml`

### Não tocar
- `docker-compose.yml` (prod)
- `Caddyfile`
- `.env.example`
- `db/prisma/schema.prisma`

---

## Task 1: Root monorepo — package.json + .gitignore

**Files:**
- Create: `package.json`
- Create: `.gitignore` (substituir `gitignore` sem dot)

- [ ] **Step 1: Criar package.json raiz com npm workspaces**

```json
{
  "name": "sbrchecks",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 2: Criar .gitignore**

```
node_modules/
dist/
.env
*.env.local
.prisma/
```

- [ ] **Step 3: Remover o `gitignore` sem dot e commitar**

```bash
git rm gitignore
git add package.json .gitignore
git commit -m "chore: root monorepo package.json e .gitignore"
```

---

## Task 2: packages/shared — esqueleto zod

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: package.json**

```json
{
  "name": "@sbrchecks/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: src/index.ts (vazio por ora)**

```typescript
// Schemas e tipos compartilhados entre api e web.
// Sprint 0: vazio. Será populado nos sprints 1+.
export {};
```

- [ ] **Step 4: Commitar**

```bash
git add packages/
git commit -m "chore: pacote shared vazio (zod)"
```

---

## Task 3: apps/api — Fastify skeleton + /health

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`

- [ ] **Step 1: package.json**

```json
{
  "name": "@sbrchecks/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@prisma/client": "^5.16.0",
    "@sbrchecks/shared": "*",
    "fastify": "^4.28.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.16.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: src/index.ts**

```typescript
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => {
  return { status: 'ok' };
});

const port = Number(process.env.PORT ?? 3000);

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
```

- [ ] **Step 4: Commitar**

```bash
git add apps/api/
git commit -m "feat(api): esqueleto Fastify com rota GET /health"
```

---

## Task 4: apps/api — Dockerfile + Prisma

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`

Prisma usa o schema em `db/prisma/schema.prisma`. O `package.json` da api referencia `prisma` e `@prisma/client`. O `DATABASE_URL` é injetado via `.env` / docker-compose.

- [ ] **Step 1: Adicionar config do Prisma em apps/api/package.json**

Adicionar campo `"prisma"` no `package.json` da api:

```json
{
  "prisma": {
    "schema": "../../db/prisma/schema.prisma"
  }
}
```

(Adicionar ao package.json já criado na Task 3.)

- [ ] **Step 2: Dockerfile (multi-stage)**

```dockerfile
# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY db/prisma ./db/prisma

RUN npm install --workspaces --include-workspace-root

COPY apps/api/src ./apps/api/src
COPY packages/shared/src ./packages/shared/src

RUN cd apps/api && npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/db/prisma ./db/prisma

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 3: .dockerignore**

```
node_modules
dist
.env
*.env.local
```

- [ ] **Step 4: Commitar**

```bash
git add apps/api/Dockerfile apps/api/.dockerignore
git commit -m "chore(api): Dockerfile multi-stage + config Prisma"
```

---

## Task 5: apps/web — React + Vite + PWA + Dexie

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/db.ts`

- [ ] **Step 1: package.json**

```json
{
  "name": "@sbrchecks/web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@sbrchecks/shared": "*",
    "dexie": "^3.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "skipLibCheck": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SBRChecks',
        short_name: 'SBRChecks',
        description: 'Gestão de visitas a PDVs — Laboratório Sobral',
        theme_color: '#1a56db',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: { host: '0.0.0.0', port: 5173 },
});
```

- [ ] **Step 5: index.html**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1a56db" />
    <title>SBRChecks</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: src/main.tsx**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
createRoot(container).render(<StrictMode><App /></StrictMode>);
```

- [ ] **Step 7: src/App.tsx**

```typescript
export default function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>SBRChecks</h1>
      <p>Gestão de visitas a PDVs — Laboratório Sobral</p>
    </main>
  );
}
```

- [ ] **Step 8: src/db.ts (Dexie — sem lógica por ora)**

```typescript
import Dexie from 'dexie';

// Banco local (IndexedDB). Lógica de tabelas e sync virá no Sprint 3.
export const db = new Dexie('sbrchecks');
```

- [ ] **Step 9: Commitar**

```bash
git add apps/web/
git commit -m "feat(web): esqueleto PWA React+Vite com vite-plugin-pwa e Dexie"
```

---

## Task 6: apps/web — Dockerfile (prod via Nginx)

**Files:**
- Create: `apps/web/Dockerfile`
- Create: `apps/web/nginx.conf`

- [ ] **Step 1: nginx.conf (SPA fallback)**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
```

- [ ] **Step 2: Dockerfile**

```dockerfile
# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspaces --include-workspace-root

COPY apps/web ./apps/web
COPY packages/shared/src ./packages/shared/src

RUN cd apps/web && npm run build

# ---- runtime stage ----
FROM nginx:stable-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 3: Commitar**

```bash
git add apps/web/Dockerfile apps/web/nginx.conf
git commit -m "chore(web): Dockerfile multi-stage + Nginx SPA"
```

---

## Task 7: docker-compose.dev.yml

**Files:**
- Create: `docker-compose.dev.yml`

- [ ] **Step 1: Criar docker-compose.dev.yml**

```yaml
# docker-compose.dev.yml — ambiente de desenvolvimento local
# Hot reload na api (tsx watch) e no web (vite dev server).
# Não inclui Caddy — acesso direto às portas.

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file: .env
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pg_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    env_file: .env
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_dev_data:/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile.dev
    restart: unless-stopped
    env_file: .env
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      S3_ENDPOINT: http://minio:9000
      PORT: "3000"
    ports:
      - "3000:3000"
    volumes:
      - ./apps/api/src:/app/apps/api/src
      - ./packages/shared/src:/app/packages/shared/src
      - ./db/prisma:/app/db/prisma
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_started
    command: >
      sh -c "npx prisma migrate deploy && npm run dev -w @sbrchecks/api"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.dev
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./apps/web/src:/app/apps/web/src
      - ./packages/shared/src:/app/packages/shared/src

volumes:
  pg_dev_data:
  minio_dev_data:
```

- [ ] **Step 2: Criar apps/api/Dockerfile.dev**

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY db/prisma ./db/prisma

RUN npm install --workspaces --include-workspace-root
RUN cd apps/api && npx prisma generate

COPY apps/api/src ./apps/api/src
COPY packages/shared/src ./packages/shared/src
```

- [ ] **Step 3: Criar apps/web/Dockerfile.dev**

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspaces --include-workspace-root

COPY apps/web/src ./apps/web/src
COPY apps/web/index.html ./apps/web/index.html
COPY apps/web/vite.config.ts ./apps/web/vite.config.ts
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/tsconfig.node.json ./apps/web/tsconfig.node.json
COPY packages/shared/src ./packages/shared/src

WORKDIR /app/apps/web
CMD ["npx", "vite", "--host"]
```

- [ ] **Step 4: Commitar**

```bash
git add docker-compose.dev.yml apps/api/Dockerfile.dev apps/web/Dockerfile.dev
git commit -m "chore: docker-compose.dev.yml com hot reload (api + web)"
```

---

## Task 8: Prisma — migration inicial

**Pre-req:** `.env` criado a partir do `.env.example` (localmente).

- [ ] **Step 1: Criar .env local a partir do exemplo**

```bash
cp .env.example .env
# editar .env com senhas locais (não commitar)
```

- [ ] **Step 2: Subir apenas o postgres**

```bash
docker-compose -f docker-compose.dev.yml up -d postgres
```

- [ ] **Step 3: Gerar a primeira migration**

```bash
docker-compose -f docker-compose.dev.yml run --rm api \
  npx prisma migrate dev --name init --schema /app/db/prisma/schema.prisma
```

Saída esperada:
```
Applying migration `20260528000000_init`
Your database is now in sync with your schema.
```

- [ ] **Step 4: Commitar os arquivos de migration gerados**

```bash
git add db/prisma/migrations/
git commit -m "chore(db): migration inicial — Sprint 0"
```

---

## Task 9: Validação end-to-end

- [ ] **Step 1: Subir tudo**

```bash
docker-compose -f docker-compose.dev.yml up --build
```

- [ ] **Step 2: Validar API**

```bash
curl http://localhost:3000/health
# Esperado: {"status":"ok"}
```

- [ ] **Step 3: Validar PWA**

Abrir `http://localhost:5173` no browser. Verificar:
- Página exibe "SBRChecks"
- DevTools → Application → Manifest → manifesto carregado
- DevTools → Application → Service Workers → SW registrado

- [ ] **Step 4: Validar MinIO**

Abrir `http://localhost:9001` — console MinIO acessível com as credenciais do `.env`.
