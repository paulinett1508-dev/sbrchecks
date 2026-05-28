# Sprint 1 — Auth Google OAuth + RBAC: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Autenticação via Google OAuth restrita ao domínio @laboratoriosobral.com.br, com três papéis (GDD, GERENTE, ADMIN), JWT stateless e tela de login adaptada do login-kit.

**Architecture:** Frontend envia `id_token` do Google para `POST /auth/google`; API verifica com `google-auth-library`, faz upsert do User no Postgres, devolve `accessToken` (JWT 15min, Bearer) e seta cookie `HttpOnly` com `refreshToken` (JWT 7d). Middleware `requireAuth` e `requireRole` protegem rotas por preHandler. Access token fica em memória no cliente (não em localStorage).

**Tech Stack:** Fastify 4, jsonwebtoken, google-auth-library, @fastify/cookie, Prisma 5, React 18, react-router-dom 6, @react-oauth/google, vitest.

---

## File Map

### Criar
- `apps/api/src/app.ts` — factory `createApp()` separado do entry point
- `apps/api/src/types.ts` — augmentação TypeScript de FastifyRequest
- `apps/api/src/lib/token.ts` — helpers sign/verify access + refresh JWT
- `apps/api/src/lib/google.ts` — helper verifyGoogleToken
- `apps/api/src/middleware/requireAuth.ts` — preHandler: verifica Bearer token
- `apps/api/src/middleware/requireRole.ts` — factory: verifica papel mínimo
- `apps/api/src/routes/auth.ts` — POST /auth/google, /refresh, /logout, GET /me
- `apps/api/src/routes/users.ts` — GET /users, PATCH /users/:id/role
- `apps/api/src/routes/auth.test.ts` — testes Fastify inject
- `apps/web/src/hooks/useAuth.tsx` — context + provider
- `apps/web/src/components/ProtectedRoute.tsx` — guarda de rota
- `apps/web/src/pages/LoginPage.tsx` — login-kit adaptado para Google
- `apps/web/src/pages/HomePage.tsx` — placeholder pós-login por papel
- `apps/web/src/pages/UnauthorizedPage.tsx` — domínio não permitido
- `apps/web/src/login.css` — CSS do login-kit

### Modificar
- `db/prisma/schema.prisma` — Role enum (GDD/GERENTE/ADMIN), User sem password, com googleId
- `apps/api/src/index.ts` — usa createApp()
- `apps/api/package.json` — adiciona deps + vitest
- `apps/web/src/App.tsx` — GoogleOAuthProvider + React Router
- `apps/web/package.json` — adiciona deps
- `packages/shared/src/index.ts` — schemas Zod
- `.env.example` — adiciona vars Google
- `docker-compose.dev.yml` — passa VITE_GOOGLE_CLIENT_ID ao web

### Assets (copiar de /tmp/labsrvfiles/docs/login-kit/assets/)
- `apps/web/public/bg_login.webp`
- `apps/web/public/logo1_transp.svg`
- `apps/web/public/logo115-background.svg`

---

## Task 0: Pré-requisito — Google Cloud OAuth credentials

> Esta task é manual. Sem ela, nenhum teste de autenticação funciona.

**Files:** nenhum (configuração externa)

- [ ] **Step 1: Criar projeto no Google Cloud Console**

  Acesse https://console.cloud.google.com → "Novo projeto" → nome: `SBRChecks`.

- [ ] **Step 2: Ativar Google OAuth**

  APIs & Serviços → Credenciais → Configurar tela de consentimento → Interno (só usuários do workspace) → preencher nome do app: `SBRChecks`.

- [ ] **Step 3: Criar credencial OAuth 2.0**

  Credenciais → Criar credenciais → ID de cliente OAuth → Aplicativo da Web.

  Origens JavaScript autorizadas:
  ```
  http://localhost:5173
  https://sbrchecks.laboratoriosobral.com.br
  ```

  Não precisa de URI de redirecionamento (fluxo é via popup/id_token).

- [ ] **Step 4: Copiar o Client ID**

  Salvar o valor (formato: `xxxxxxxx.apps.googleusercontent.com`) — será usado nos Steps seguintes.

---

## Task 1: Schema — Role GDD/ADMIN, User sem password, com googleId

**Files:**
- Modify: `db/prisma/schema.prisma`

- [ ] **Step 1: Atualizar schema.prisma**

  Substituir:
  ```prisma
  enum Role {
    VENDEDOR
    GERENTE
  }
  ```
  Por:
  ```prisma
  enum Role {
    GDD
    GERENTE
    ADMIN
  }
  ```

  Substituir o model `User`:
  ```prisma
  model User {
    id        String   @id @default(uuid())
    name      String
    email     String   @unique
    googleId  String   @unique
    role      Role     @default(GDD)
    active    Boolean  @default(true)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    pdvs   PdvAssignment[]
    visits Visit[]
  }
  ```

  (Removidos: `password String`. Adicionado: `googleId String @unique`.)

- [ ] **Step 2: Gerar e aplicar migration (dentro do container)**

  ```bash
  # Terminal WSL, na raiz do projeto:
  docker-compose -f docker-compose.dev.yml exec api \
    npx prisma migrate dev --name auth-google-rbac \
    --schema /app/db/prisma/schema.prisma
  ```

  Saída esperada:
  ```
  Applying migration `20260528xxxxxx_auth_google_rbac`
  Your database is now in sync with your schema.
  ```

- [ ] **Step 3: Commitar**

  ```bash
  git add db/prisma/schema.prisma db/prisma/migrations/
  git commit -m "feat(db): Role GDD/ADMIN, User sem password, googleId"
  ```

---

## Task 2: packages/shared — Zod schemas

**Files:**
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Escrever schemas**

  ```typescript
  import { z } from 'zod';

  export const RoleSchema = z.enum(['GDD', 'GERENTE', 'ADMIN']);
  export type Role = z.infer<typeof RoleSchema>;

  export const GoogleAuthInput = z.object({
    idToken: z.string().min(1),
  });

  export const UpdateRoleInput = z.object({
    role: RoleSchema,
  });

  export const UserDto = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: RoleSchema,
    active: z.boolean(),
  });

  export type UserDto = z.infer<typeof UserDto>;
  ```

- [ ] **Step 2: Commitar**

  ```bash
  git add packages/shared/src/index.ts
  git commit -m "feat(shared): Zod schemas para auth Sprint 1"
  ```

---

## Task 3: API — dependências + vitest + types

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/types.ts`
- Create: `apps/api/vitest.config.ts`

- [ ] **Step 1: Atualizar package.json**

  ```json
  {
    "name": "@sbrchecks/api",
    "version": "0.0.1",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "tsx watch src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js",
      "test": "vitest run"
    },
    "prisma": {
      "schema": "../../db/prisma/schema.prisma"
    },
    "dependencies": {
      "@fastify/cookie": "^9.4.0",
      "@prisma/client": "^5.16.0",
      "@sbrchecks/shared": "*",
      "fastify": "^4.28.0",
      "google-auth-library": "^9.14.0",
      "jsonwebtoken": "^9.0.2",
      "zod": "^3.23.0"
    },
    "devDependencies": {
      "@types/jsonwebtoken": "^9.0.6",
      "@types/node": "^20.0.0",
      "prisma": "^5.16.0",
      "tsx": "^4.0.0",
      "typescript": "^5.5.0",
      "vitest": "^2.0.0"
    }
  }
  ```

- [ ] **Step 2: Criar apps/api/vitest.config.ts**

  ```typescript
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      environment: 'node',
    },
  });
  ```

- [ ] **Step 3: Criar apps/api/src/types.ts**

  ```typescript
  declare module 'fastify' {
    interface FastifyRequest {
      user: {
        sub: string;
        role: 'GDD' | 'GERENTE' | 'ADMIN';
      };
    }
  }
  export {};
  ```

- [ ] **Step 4: Instalar deps dentro do container**

  ```bash
  docker-compose -f docker-compose.dev.yml exec api \
    npm install --prefix /app/apps/api
  ```

  Ou rebuildar: `docker-compose -f docker-compose.dev.yml up --build api`

- [ ] **Step 5: Commitar**

  ```bash
  git add apps/api/package.json apps/api/src/types.ts apps/api/vitest.config.ts
  git commit -m "chore(api): deps auth + vitest + types"
  ```

---

## Task 4: API — lib/token.ts + lib/google.ts

**Files:**
- Create: `apps/api/src/lib/token.ts`
- Create: `apps/api/src/lib/google.ts`

- [ ] **Step 1: Criar apps/api/src/lib/token.ts**

  ```typescript
  import jwt from 'jsonwebtoken';
  import type { Role } from '@sbrchecks/shared';

  export interface AccessPayload {
    sub: string;
    role: Role;
  }

  interface RefreshPayload {
    sub: string;
    type: 'refresh';
  }

  export function signAccessToken(payload: AccessPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
  }

  export function signRefreshToken(sub: string): string {
    return jwt.sign(
      { sub, type: 'refresh' } satisfies RefreshPayload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }

  export function verifyAccessToken(token: string): AccessPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as AccessPayload;
  }

  export function verifyRefreshToken(token: string): { sub: string } {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshPayload;
    if (payload.type !== 'refresh') throw new Error('Invalid token type');
    return { sub: payload.sub };
  }
  ```

- [ ] **Step 2: Criar apps/api/src/lib/google.ts**

  ```typescript
  import { OAuth2Client } from 'google-auth-library';

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? 'laboratoriosobral.com.br';

  export interface GoogleUser {
    googleId: string;
    email: string;
    name: string;
  }

  export async function verifyGoogleToken(idToken: string): Promise<GoogleUser> {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Empty payload');
    if (payload.hd !== ALLOWED_DOMAIN) {
      throw new Error(`Domain not allowed: ${payload.hd}`);
    }
    return {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name ?? payload.email!,
    };
  }
  ```

- [ ] **Step 3: Commitar**

  ```bash
  git add apps/api/src/lib/
  git commit -m "feat(api): helpers token JWT e verificação Google"
  ```

---

## Task 5: API — middleware requireAuth + requireRole

**Files:**
- Create: `apps/api/src/middleware/requireAuth.ts`
- Create: `apps/api/src/middleware/requireRole.ts`

- [ ] **Step 1: Criar requireAuth.ts**

  ```typescript
  import type { FastifyRequest, FastifyReply } from 'fastify';
  import { verifyAccessToken } from '../lib/token.js';

  export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    try {
      request.user = verifyAccessToken(auth.slice(7));
    } catch {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
  }
  ```

- [ ] **Step 2: Criar requireRole.ts**

  ```typescript
  import type { FastifyRequest, FastifyReply } from 'fastify';
  import type { Role } from '@sbrchecks/shared';

  const ROLE_RANK: Record<Role, number> = { GDD: 0, GERENTE: 1, ADMIN: 2 };

  export function requireRole(minRole: Role) {
    return async function (
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void> {
      if (ROLE_RANK[request.user.role] < ROLE_RANK[minRole]) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
    };
  }
  ```

- [ ] **Step 3: Commitar**

  ```bash
  git add apps/api/src/middleware/
  git commit -m "feat(api): middleware requireAuth e requireRole"
  ```

---

## Task 6: API — app.ts + refatorar index.ts

**Files:**
- Create: `apps/api/src/app.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Criar apps/api/src/app.ts**

  ```typescript
  import Fastify, { type FastifyInstance } from 'fastify';
  import cookie from '@fastify/cookie';
  import './types.js';
  import { authRoutes } from './routes/auth.js';
  import { usersRoutes } from './routes/users.js';

  export async function createApp(): Promise<FastifyInstance> {
    const app = Fastify({
      logger: process.env.NODE_ENV !== 'test',
    });

    await app.register(cookie);

    app.get('/health', async () => ({ status: 'ok' }));
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(usersRoutes, { prefix: '/users' });

    return app;
  }
  ```

- [ ] **Step 2: Atualizar apps/api/src/index.ts**

  ```typescript
  import { createApp } from './app.js';

  const port = Number(process.env.PORT ?? 3000);

  createApp().then((app) => {
    app.listen({ port, host: '0.0.0.0' }, (err) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
    });
  });
  ```

- [ ] **Step 3: Commitar**

  ```bash
  git add apps/api/src/app.ts apps/api/src/index.ts
  git commit -m "refactor(api): extrair createApp() para facilitar testes"
  ```

---

## Task 7: API — routes/auth.ts

**Files:**
- Create: `apps/api/src/routes/auth.ts`

- [ ] **Step 1: Criar o arquivo**

  ```typescript
  import type { FastifyInstance } from 'fastify';
  import { PrismaClient } from '@prisma/client';
  import { GoogleAuthInput } from '@sbrchecks/shared';
  import { verifyGoogleToken } from '../lib/google.js';
  import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
  } from '../lib/token.js';
  import { requireAuth } from '../middleware/requireAuth.js';

  const prisma = new PrismaClient();
  const REFRESH_COOKIE = 'refresh';
  const COOKIE_OPTS = {
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  };

  export async function authRoutes(app: FastifyInstance) {
    // POST /auth/google
    app.post('/google', async (request, reply) => {
      const body = GoogleAuthInput.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: 'idToken obrigatório' });
      }

      let googleUser;
      try {
        googleUser = await verifyGoogleToken(body.data.idToken);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Token inválido';
        const isDomain = msg.includes('Domain not allowed');
        return reply
          .code(isDomain ? 403 : 401)
          .send({ error: isDomain ? 'Domínio não autorizado' : 'Token Google inválido' });
      }

      let user = await prisma.user.findUnique({
        where: { googleId: googleUser.googleId },
      });

      if (!user) {
        const isAdmin = googleUser.email === process.env.SEED_ADMIN_EMAIL;
        user = await prisma.user.create({
          data: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            name: googleUser.name,
            role: isAdmin ? 'ADMIN' : 'GDD',
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: googleUser.name },
        });
      }

      if (!user.active) {
        return reply.code(403).send({ error: 'Usuário desativado' });
      }

      const accessToken = signAccessToken({ sub: user.id, role: user.role });
      const refreshToken = signRefreshToken(user.id);

      reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);

      return reply.send({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });

    // POST /auth/refresh
    app.post('/refresh', async (request, reply) => {
      const token = request.cookies[REFRESH_COOKIE];
      if (!token) {
        return reply.code(401).send({ error: 'Sem refresh token' });
      }
      try {
        const { sub } = verifyRefreshToken(token);
        const user = await prisma.user.findUnique({ where: { id: sub } });
        if (!user || !user.active) {
          return reply.code(401).send({ error: 'Usuário não encontrado' });
        }
        const accessToken = signAccessToken({ sub: user.id, role: user.role });
        return reply.send({ accessToken });
      } catch {
        return reply.code(401).send({ error: 'Refresh token inválido' });
      }
    });

    // POST /auth/logout
    app.post('/logout', async (_request, reply) => {
      reply.clearCookie(REFRESH_COOKIE, { path: '/' });
      return reply.send({ ok: true });
    });

    // GET /auth/me
    app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.sub },
        select: { id: true, name: true, email: true, role: true, active: true },
      });
      if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
      return reply.send(user);
    });
  }
  ```

- [ ] **Step 2: Commitar**

  ```bash
  git add apps/api/src/routes/auth.ts
  git commit -m "feat(api): rotas POST /auth/google /refresh /logout GET /me"
  ```

---

## Task 8: API — routes/users.ts

**Files:**
- Create: `apps/api/src/routes/users.ts`

- [ ] **Step 1: Criar o arquivo**

  ```typescript
  import type { FastifyInstance } from 'fastify';
  import { PrismaClient } from '@prisma/client';
  import { UpdateRoleInput } from '@sbrchecks/shared';
  import { requireAuth } from '../middleware/requireAuth.js';
  import { requireRole } from '../middleware/requireRole.js';

  const prisma = new PrismaClient();

  export async function usersRoutes(app: FastifyInstance) {
    // GET /users — GERENTE e ADMIN
    app.get(
      '/',
      { preHandler: [requireAuth, requireRole('GERENTE')] },
      async (_request, reply) => {
        const users = await prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true, active: true },
          orderBy: { name: 'asc' },
        });
        return reply.send(users);
      }
    );

    // PATCH /users/:id/role — só ADMIN
    app.patch(
      '/:id/role',
      { preHandler: [requireAuth, requireRole('ADMIN')] },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = UpdateRoleInput.safeParse(request.body);
        if (!body.success) {
          return reply.code(400).send({ error: 'Papel inválido' });
        }
        const user = await prisma.user.update({
          where: { id },
          data: { role: body.data.role },
          select: { id: true, name: true, email: true, role: true },
        });
        return reply.send(user);
      }
    );
  }
  ```

- [ ] **Step 2: Commitar**

  ```bash
  git add apps/api/src/routes/users.ts
  git commit -m "feat(api): rotas GET /users PATCH /users/:id/role"
  ```

---

## Task 9: API — teste de integração (auth routes)

**Files:**
- Create: `apps/api/src/routes/auth.test.ts`

- [ ] **Step 1: Criar o arquivo de teste**

  ```typescript
  import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
  import { createApp } from '../app.js';
  import type { FastifyInstance } from 'fastify';

  // Mock google-auth-library antes de importar createApp
  vi.mock('google-auth-library', () => ({
    OAuth2Client: vi.fn().mockImplementation(() => ({
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: () => ({
          sub: 'google-test-id-001',
          email: 'test.user@laboratoriosobral.com.br',
          name: 'Test User',
          hd: 'laboratoriosobral.com.br',
        }),
      }),
    })),
  }));

  // Mock Prisma
  vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: {
        findUnique: vi.fn().mockResolvedValue(null), // simula primeiro login
        create: vi.fn().mockResolvedValue({
          id: 'user-id-001',
          googleId: 'google-test-id-001',
          email: 'test.user@laboratoriosobral.com.br',
          name: 'Test User',
          role: 'GDD',
          active: true,
        }),
        update: vi.fn(),
      },
    })),
  }));

  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-access';
    process.env.JWT_REFRESH_SECRET = 'test-secret-refresh';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.ALLOWED_DOMAIN = 'laboratoriosobral.com.br';
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/google', () => {
    it('retorna 400 sem idToken', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('retorna accessToken e user no primeiro login', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: { idToken: 'mock-valid-token' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ accessToken: string; user: { role: string } }>();
      expect(body.accessToken).toBeDefined();
      expect(body.user.role).toBe('GDD');
    });

    it('seta cookie refresh HttpOnly', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: { idToken: 'mock-valid-token' },
      });
      const cookies = res.headers['set-cookie'] as string | string[];
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('refresh=');
      expect(cookieStr).toContain('HttpOnly');
    });
  });

  describe('GET /auth/me', () => {
    it('retorna 401 sem token', async () => {
      const res = await app.inject({ method: 'GET', url: '/auth/me' });
      expect(res.statusCode).toBe(401);
    });
  });
  ```

- [ ] **Step 2: Rodar testes (dentro do container)**

  ```bash
  docker-compose -f docker-compose.dev.yml exec api \
    npm test -w @sbrchecks/api
  ```

  Saída esperada:
  ```
  ✓ POST /auth/google > retorna 400 sem idToken
  ✓ POST /auth/google > retorna accessToken e user no primeiro login
  ✓ POST /auth/google > seta cookie refresh HttpOnly
  ✓ GET /auth/me > retorna 401 sem token
  ```

- [ ] **Step 3: Commitar**

  ```bash
  git add apps/api/src/routes/auth.test.ts
  git commit -m "test(api): testes de integração rotas auth"
  ```

---

## Task 10: Variáveis de ambiente + docker-compose.dev.yml

**Files:**
- Modify: `.env.example`
- Modify: `.env` (local — não commitar)
- Modify: `docker-compose.dev.yml`

- [ ] **Step 1: Atualizar .env.example**

  Adicionar ao final:
  ```bash
  # Google OAuth (obter no Google Cloud Console)
  GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
  ALLOWED_DOMAIN=laboratoriosobral.com.br

  # Admin seed (email do owner/superadmin)
  SEED_ADMIN_EMAIL=paulinete.miranda@laboratoriosobral.com.br

  # Frontend (mesmo Client ID — prefixo VITE_ é obrigatório para o Vite expor)
  VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
  ```

- [ ] **Step 2: Adicionar ao .env local (não commitar)**

  Preencher `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` com o valor obtido na Task 0.

- [ ] **Step 3: Adicionar VITE_GOOGLE_CLIENT_ID ao serviço web no docker-compose.dev.yml**

  No serviço `web`, dentro de `environment:`, adicionar:
  ```yaml
  VITE_GOOGLE_CLIENT_ID: ${VITE_GOOGLE_CLIENT_ID}
  ```

- [ ] **Step 4: Commitar (só .env.example e docker-compose.dev.yml)**

  ```bash
  git add .env.example docker-compose.dev.yml
  git commit -m "chore: env vars Google OAuth no .env.example e compose"
  ```

---

## Task 11: Web — dependências + assets do login-kit

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/login.css`
- Copy: `apps/web/public/bg_login.webp`, `logo1_transp.svg`, `logo115-background.svg`

- [ ] **Step 1: Atualizar apps/web/package.json**

  Adicionar em `dependencies`:
  ```json
  "@react-oauth/google": "^0.12.1",
  "react-router-dom": "^6.26.0"
  ```

- [ ] **Step 2: Copiar assets do login-kit**

  ```bash
  # De dentro do WSL (o clone esparso ainda está em /tmp/labsrvfiles):
  cp /tmp/labsrvfiles/docs/login-kit/assets/bg_login.webp \
     "/mnt/c/PROJETOS/CONTA SUPORTE/SbrChecks/apps/web/public/"
  cp /tmp/labsrvfiles/docs/login-kit/assets/logo1_transp.svg \
     "/mnt/c/PROJETOS/CONTA SUPORTE/SbrChecks/apps/web/public/"
  cp /tmp/labsrvfiles/docs/login-kit/assets/logo115-background.svg \
     "/mnt/c/PROJETOS/CONTA SUPORTE/SbrChecks/apps/web/public/"
  ```

- [ ] **Step 3: Criar apps/web/src/login.css**

  O LoginPage.tsx usa classes próprias (`login-root`, `login-left`, `login-card-header`, etc.) que não existem no login.css HTML original. Criar o arquivo completo abaixo — incorpora a paleta e animações do kit com as classes corretas:

  ```css
  @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');

  :root {
    --accent-1:      #e76327;
    --accent-2:      #c0392b;
    --accent-bright: #ff6501;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Ubuntu', sans-serif; height: 100vh; overflow: hidden; }

  /* Layout duas colunas */
  .login-root {
    display: flex;
    height: 100vh;
  }

  /* Painel esquerdo */
  .login-left {
    position: relative;
    flex: 1;
    overflow: hidden;
    display: none;
  }
  @media (min-width: 768px) { .login-left { display: block; } }

  .login-left-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .login-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, rgba(5,10,25,.82) 0%, rgba(5,10,25,.65) 40%, rgba(0,0,0,.88) 100%);
    z-index: 1;
  }

  .login-left-deco {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .login-deco-circle {
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,.06);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }

  .login-deco-corner-tr {
    position: absolute;
    top: 32px; right: 32px;
    width: 60px; height: 60px;
    border-top: 2px solid rgba(255,255,255,.25);
    border-right: 2px solid rgba(255,255,255,.25);
    border-radius: 0 4px 0 0;
    z-index: 2;
  }

  .login-deco-corner-bl {
    position: absolute;
    bottom: 32px; left: 32px;
    width: 60px; height: 60px;
    border-bottom: 2px solid rgba(255,255,255,.25);
    border-left: 2px solid rgba(255,255,255,.25);
    border-radius: 0 0 0 4px;
    z-index: 2;
  }

  .login-deco-lines {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    z-index: 2;
    pointer-events: none;
  }

  .login-left-content {
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
    animation: fadeSlideUp .6s cubic-bezier(.16,1,.3,1) both;
  }

  .login-left-logo { width: 100px; height: auto; }

  .login-left-content h1 {
    font-size: 2rem; font-weight: 700; color: #fff;
    letter-spacing: .1em;
    text-shadow: 0 2px 12px rgba(0,0,0,.5);
  }

  .brand-sub { font-size: .85rem; color: rgba(255,255,255,.5); font-weight: 300; }

  /* Painel direito */
  .login-right {
    width: 100%;
    max-width: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: #0f172a;
  }
  @media (min-width: 768px) { .login-right { width: 420px; flex-shrink: 0; } }

  /* Card */
  .login-card {
    width: 100%;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(231,99,39,.2);
    box-shadow: 0 24px 64px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04);
    animation: fadeSlideUp .55s cubic-bezier(.16,1,.3,1) both;
  }

  .login-card-header {
    background: var(--accent-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 2rem;
  }

  .login-card-header-logo {
    width: 120px; height: 120px;
    object-fit: contain;
    animation: logoReveal .7s cubic-bezier(.16,1,.3,1) both;
  }

  .login-card-body {
    padding: 2rem 2.5rem 2.5rem;
    background: rgba(255,255,255,.055);
    backdrop-filter: blur(40px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .login-card-body h2 {
    font-size: 1.4rem; font-weight: 700; color: #fff;
    letter-spacing: -.02em; text-align: center;
  }

  .subtitle { font-size: .75rem; color: rgba(255,255,255,.45); text-align: center; }
  .card-divider { width: 100%; height: 1px; background: rgba(255,255,255,.08); }
  .card-footer { font-size: .75rem; color: rgba(255,255,255,.3); text-align: center; }

  /* Erro */
  .login-error {
    width: 100%;
    font-size: .8125rem;
    color: #fca5a5;
    background: rgba(239,68,68,.12);
    border: 1px solid rgba(239,68,68,.25);
    border-radius: 8px;
    padding: .5rem .75rem;
    text-align: center;
  }

  /* Botão */
  .btn-submit {
    width: 100%;
    padding: .875rem 1.5rem;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
    color: #fff;
    border: none;
    border-radius: 12px;
    font-family: 'Ubuntu', sans-serif;
    font-size: .9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
    box-shadow: 0 2px 8px rgba(231,99,39,.3);
  }
  .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(231,99,39,.4); }
  .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

  @keyframes logoReveal  { from { opacity: 0; transform: scale(.88); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  ```

- [ ] **Step 4: Commitar**

  ```bash
  git add apps/web/package.json apps/web/src/login.css apps/web/public/
  git commit -m "feat(web): deps react-router + @react-oauth/google + assets login-kit"
  ```

---

## Task 12: Web — useAuth hook

**Files:**
- Create: `apps/web/src/hooks/useAuth.tsx`

- [ ] **Step 1: Criar o arquivo**

  ```typescript
  import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
  } from 'react';
  import type { UserDto } from '@sbrchecks/shared';

  interface AuthState {
    accessToken: string | null;
    user: UserDto | null;
  }

  interface AuthContextValue extends AuthState {
    login: (token: string, user: UserDto) => void;
    logout: () => Promise<void>;
    refreshAccess: () => Promise<string | null>;
  }

  const AuthContext = createContext<AuthContextValue | null>(null);

  const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
      accessToken: null,
      user: null,
    });

    const login = useCallback((token: string, user: UserDto) => {
      setState({ accessToken: token, user });
    }, []);

    const logout = useCallback(async () => {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      setState({ accessToken: null, user: null });
    }, []);

    const refreshAccess = useCallback(async (): Promise<string | null> => {
      try {
        const res = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken: string };
        setState((s) => ({ ...s, accessToken: data.accessToken }));
        return data.accessToken;
      } catch {
        return null;
      }
    }, []);

    return (
      <AuthContext.Provider value={{ ...state, login, logout, refreshAccess }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
  }
  ```

- [ ] **Step 2: Commitar**

  ```bash
  git add apps/web/src/hooks/useAuth.tsx
  git commit -m "feat(web): hook useAuth com contexto em memória"
  ```

---

## Task 13: Web — LoginPage

**Files:**
- Create: `apps/web/src/pages/LoginPage.tsx`

- [ ] **Step 1: Criar o arquivo**

  ```typescript
  import { useGoogleLogin } from '@react-oauth/google';
  import { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useAuth } from '../hooks/useAuth';
  import type { UserDto } from '@sbrchecks/shared';
  import '../login.css';

  const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGoogle = useGoogleLogin({
      onSuccess: async ({ credential }) => {
        if (!credential) return;
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`${API}/auth/google`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: credential }),
          });
          if (res.status === 403) {
            navigate('/unauthorized');
            return;
          }
          if (!res.ok) {
            setError('Falha ao autenticar. Tente novamente.');
            return;
          }
          const data = (await res.json()) as {
            accessToken: string;
            user: UserDto;
          };
          login(data.accessToken, data.user);
          navigate('/');
        } catch {
          setError('Falha de conexão. Verifique a rede.');
        } finally {
          setLoading(false);
        }
      },
      onError: () => setError('Login Google cancelado ou falhou.'),
      flow: 'implicit',
    });

    return (
      <div className="login-root">
        {/* Painel esquerdo */}
        <div className="login-left">
          <img src="/bg_login.webp" alt="" className="login-left-bg" />
          <div className="login-overlay" />
          <div className="login-left-deco" />
          <div className="login-deco-circle" />
          <div className="login-deco-corner-tr" />
          <div className="login-deco-corner-bl" />
          <svg
            className="login-deco-lines"
            viewBox="0 0 500 700"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <line x1="0" y1="200" x2="200" y2="0" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <line x1="0" y1="350" x2="350" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <line x1="50" y1="700" x2="500" y2="250" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle cx="420" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx="80" cy="620" r="80" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          </svg>
          <div className="login-left-content">
            <img src="/logo1_transp.svg" alt="Laboratório Sobral" className="login-left-logo" />
            <h1>SBRChecks</h1>
            <p className="brand-sub">Laboratório Sobral</p>
          </div>
        </div>

        {/* Painel direito */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-card-header">
              <img src="/logo115-background.svg" alt="" className="login-card-header-logo" />
            </div>
            <div className="login-card-body">
              <h2>Entrar no SBRChecks</h2>
              <p className="subtitle">Área restrita · Colaboradores autorizados</p>
              <div className="card-divider" />

              {error && <p className="login-error" style={{ display: 'block' }}>{error}</p>}

              <button
                className="btn-submit"
                onClick={() => handleGoogle()}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Autenticando…' : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8.9 20-20 0-1.3-.1-2.7-.4-4z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.3l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.7 5.9l6.2 5.2C40.5 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                    </svg>
                    Entrar com Google
                  </>
                )}
              </button>

              <p className="card-footer">Apenas colaboradores @laboratoriosobral.com.br</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commitar**

  ```bash
  git add apps/web/src/pages/LoginPage.tsx
  git commit -m "feat(web): LoginPage com botão Google (login-kit)"
  ```

---

## Task 14: Web — App routing + páginas placeholder

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/main.tsx`
- Create: `apps/web/src/components/ProtectedRoute.tsx`
- Create: `apps/web/src/pages/HomePage.tsx`
- Create: `apps/web/src/pages/UnauthorizedPage.tsx`

- [ ] **Step 1: Criar ProtectedRoute.tsx**

  ```typescript
  import { Navigate } from 'react-router-dom';
  import { useAuth } from '../hooks/useAuth';

  export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { accessToken } = useAuth();
    if (!accessToken) return <Navigate to="/login" replace />;
    return <>{children}</>;
  }
  ```

- [ ] **Step 2: Criar HomePage.tsx**

  ```typescript
  import { useAuth } from '../hooks/useAuth';

  const MESSAGES: Record<string, string> = {
    GDD: 'Sua rota do dia aparecerá aqui — Sprint 2',
    GERENTE: 'Painel do gerente — Sprint 5',
    ADMIN: 'Painel do gerente — Sprint 5',
  };

  export function HomePage() {
    const { user, logout } = useAuth();
    if (!user) return null;
    return (
      <main style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>SBRChecks</h1>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
          Olá, <strong>{user.name}</strong> — papel:{' '}
          <span style={{ color: '#e76327' }}>{user.role}</span>
        </p>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>{MESSAGES[user.role]}</p>
        <button
          onClick={logout}
          style={{ padding: '0.5rem 1rem', background: '#e76327', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Sair
        </button>
      </main>
    );
  }
  ```

- [ ] **Step 3: Criar UnauthorizedPage.tsx**

  ```typescript
  export function UnauthorizedPage() {
    return (
      <main style={{ fontFamily: 'sans-serif', padding: '4rem 2rem', textAlign: 'center', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
        <h1 style={{ color: '#e76327' }}>Acesso negado</h1>
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
          Apenas contas @laboratoriosobral.com.br têm acesso ao SBRChecks.
        </p>
      </main>
    );
  }
  ```

- [ ] **Step 4: Atualizar App.tsx**

  ```typescript
  import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
  import { LoginPage } from './pages/LoginPage';
  import { HomePage } from './pages/HomePage';
  import { UnauthorizedPage } from './pages/UnauthorizedPage';
  import { ProtectedRoute } from './components/ProtectedRoute';

  export default function App() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }
  ```

- [ ] **Step 5: Atualizar main.tsx com GoogleOAuthProvider + AuthProvider**

  ```typescript
  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { GoogleOAuthProvider } from '@react-oauth/google';
  import { AuthProvider } from './hooks/useAuth';
  import App from './App';

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

  const container = document.getElementById('root');
  if (!container) throw new Error('Root element not found');

  createRoot(container).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </StrictMode>
  );
  ```

- [ ] **Step 6: Commitar**

  ```bash
  git add apps/web/src/
  git commit -m "feat(web): routing React Router + LoginPage + HomePage + ProtectedRoute"
  ```

---

## Task 15: Validação end-to-end

- [ ] **Step 1: Rebuild e subir tudo**

  ```bash
  # WSL, na raiz do projeto:
  docker-compose -f docker-compose.dev.yml up --build
  ```

- [ ] **Step 2: Validar /health**

  ```bash
  curl http://localhost:3000/health
  # { "status": "ok" }
  ```

- [ ] **Step 3: Validar /auth/me sem token (deve retornar 401)**

  ```bash
  curl http://localhost:3000/auth/me
  # { "error": "Unauthorized" }
  ```

- [ ] **Step 4: Validar frontend**

  Abrir http://localhost:5173 → redireciona para /login.
  Clicar "Entrar com Google" → popup Google → escolher conta @laboratoriosobral.com.br.
  Após login → tela home com nome, papel e botão "Sair".

- [ ] **Step 5: Validar domínio bloqueado**

  Tentar login com conta fora de @laboratoriosobral.com.br → redireciona para /unauthorized.

- [ ] **Step 6: Commitar se tudo ok**

  ```bash
  git add .
  git commit -m "feat: Sprint 1 completo — auth Google OAuth + RBAC"
  ```
