# Sprint 1 — Autenticação Google OAuth + RBAC: Design Spec

**Data:** 2026-05-28
**Status:** aprovado para implementação

---

## Contexto

Sistema interno de gestão de visitas (SBRChecks) para o Laboratório Sobral.
Todos os usuários possuem conta Google `@laboratoriosobral.com.br`.
Não haverá login por email/senha.

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---|---|---|
| Provedor de auth | Google OAuth (client-side id_token) | Compatível com PWA offline-first; zero sessão server-side |
| Domínio restrito | `@laboratoriosobral.com.br` | Rejeitar contas externas na validação do id_token |
| Access token | JWT 15 min, header `Authorization: Bearer` | Curto para limitar janela de vazamento |
| Refresh token | JWT 7 dias, cookie `HttpOnly; SameSite=Strict` | Mais seguro que localStorage; funciona com PWA |
| Armazenamento refresh | Stateless (sem tabela no banco) | Simplicidade; revogação por expiração natural |
| Primeiro ADMIN | `SEED_ADMIN_EMAIL` no `.env` | Designado por email no primeiro login Google |

---

## Papéis (RBAC)

```
GDD      → ex-Vendedor: Gerador de Demandas (campo)
GERENTE  → supervisor; vê usuários, não promove
ADMIN    → superadmin/owner; promove e rebaixa qualquer papel
```

**Matriz de permissões (Sprint 1):**

| Ação | GDD | GERENTE | ADMIN |
|---|:---:|:---:|:---:|
| Login Google | ✓ | ✓ | ✓ |
| `GET /auth/me` | ✓ | ✓ | ✓ |
| `GET /users` | — | ✓ | ✓ |
| `PATCH /users/:id/role` | — | — | ✓ |

---

## Schema — alterações ao `db/prisma/schema.prisma`

### Role enum

```prisma
enum Role {
  GDD      // Gerador de Demandas (era VENDEDOR)
  GERENTE
  ADMIN
}
```

### Model User

Remover: campo `password String`
Adicionar: `googleId String @unique`

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

Migration: `prisma migrate dev --name auth-google-rbac`

---

## API — endpoints

```
POST   /auth/google          Valida id_token Google → emite access + refresh JWT
POST   /auth/refresh         Usa refresh token (cookie) → novo access token
POST   /auth/logout          Limpa cookie refresh (stateless: sem invalidação server-side)
GET    /auth/me              Retorna usuário autenticado (requer access token)

GET    /users                Lista todos os usuários (GERENTE, ADMIN)
PATCH  /users/:id/role       Atualiza papel do usuário (ADMIN only)
```

### Fluxo de login

```
1. Frontend: GoogleOAuthProvider → useGoogleLogin() → popup Google
2. Google devolve { credential: id_token }
3. Frontend: POST /auth/google { idToken }
4. API: verifica id_token com google-auth-library
5. API: confirma hd === "laboratoriosobral.com.br"
6. API: upsert User (cria se primeiro login; se email === SEED_ADMIN_EMAIL e Role === GDD, promove para ADMIN)
7. API: emite accessToken (JWT 15min) + refreshToken (JWT 7d)
8. API: seta cookie HttpOnly com refreshToken; retorna { accessToken, user }
9. Frontend: guarda accessToken em memória (não em localStorage)
```

### Contratos Zod (packages/shared)

```typescript
// POST /auth/google
export const GoogleAuthInput = z.object({
  idToken: z.string().min(1),
});

// PATCH /users/:id/role
export const UpdateRoleInput = z.object({
  role: z.enum(['GDD', 'GERENTE', 'ADMIN']),
});

// Response user
export const UserDto = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['GDD', 'GERENTE', 'ADMIN']),
  active: z.boolean(),
});
```

---

## Variáveis de ambiente — adições ao `.env.example`

```bash
# Google OAuth
GOOGLE_CLIENT_ID=<client_id_do_projeto_no_gcp>
ALLOWED_DOMAIN=laboratoriosobral.com.br

# Admin seed
SEED_ADMIN_EMAIL=paulinete.miranda@laboratoriosobral.com.br
```

---

## Frontend — tela de login

**Base:** `login-kit` (LoginPage.tsx + login.css + assets do Laboratório Sobral).

**Adaptação:** substituir o form `username + password` por um único botão Google.
A estrutura visual permanece intacta:
- Painel esquerdo: `bg_login.webp` + overlay + decorações + logo `logo1_transp.svg` + "SBRChecks"
- Card direito: header laranja `logo115-background.svg` + corpo glassmorphism

**Componente resultante:** `apps/web/src/pages/LoginPage.tsx`

```tsx
// Botão substitui o <form>:
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  text="signin_with_google"
  locale="pt-BR"
/>
```

**Rotas protegidas (React Router):**
```
/login          → LoginPage (pública)
/               → HomePage (requer auth; redireciona por papel)
/unauthorized   → mensagem de acesso negado (domínio errado)
```

**Pós-login por papel (Sprint 1 — placeholders):**
```
GDD      → "Sua rota do dia aparecerá aqui — Sprint 2"
GERENTE  → "Painel do gerente — Sprint 5"
ADMIN    → mesmo que GERENTE + badge "ADMIN"
```

---

## Dependências novas

### apps/api
```json
"@fastify/cookie": "^9.x",
"@fastify/jwt": "^8.x",
"google-auth-library": "^9.x"
```

### apps/web
```json
"@react-oauth/google": "^0.12.x",
"react-router-dom": "^6.x"
```

---

## Arquivos a criar / modificar

```
db/prisma/schema.prisma                    modificar (Role enum, User model)
db/prisma/migrations/..._auth-google-rbac  gerado pelo migrate dev

packages/shared/src/index.ts              adicionar schemas Zod (GoogleAuthInput, UpdateRoleInput, UserDto)

apps/api/src/index.ts                     registrar plugins (cookie, jwt), montar rotas
apps/api/src/plugins/jwt.ts               configurar @fastify/jwt + @fastify/cookie
apps/api/src/routes/auth.ts               POST /auth/google, /refresh, /logout, GET /me
apps/api/src/routes/users.ts              GET /users, PATCH /users/:id/role
apps/api/src/middleware/requireAuth.ts    decorator: verifica access token
apps/api/src/middleware/requireRole.ts    decorator: verifica papel mínimo

apps/web/public/                          copiar assets do login-kit (logos, bg_login.webp)
apps/web/src/main.tsx                     envolver com GoogleOAuthProvider
apps/web/src/App.tsx                      adicionar React Router + rotas protegidas
apps/web/src/pages/LoginPage.tsx          componente adaptado do login-kit
apps/web/src/pages/HomePage.tsx           placeholder pós-login por papel
apps/web/src/pages/UnauthorizedPage.tsx   acesso negado
apps/web/src/hooks/useAuth.ts             contexto de auth (accessToken, user, login, logout)
apps/web/src/login.css                    CSS do login-kit (copiado)
```

---

## O que NÃO entra no Sprint 1

- Tela de listagem/gestão de usuários completa (Sprint 1 só entrega o endpoint; a UI vem no Sprint 5)
- Notificações push
- Cadastro manual de usuário por formulário (todos entram via Google)
- Recuperação de senha (não existe — auth é 100% Google)
