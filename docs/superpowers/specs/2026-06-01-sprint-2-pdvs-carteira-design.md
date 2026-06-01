# Sprint 2 — PDVs, Carteira e Sync Offline: Design Spec

**Data:** 2026-06-01
**Status:** aprovado para implementação

---

## Contexto

Com o Sprint 1 (autenticação) concluído, o Sprint 2 estabelece a base operacional:
cadastro de PDVs (pontos de venda), atribuição a GDDs (Geradores de Demanda) e
sincronização offline da carteira no PWA. Os dados iniciais virão de um export do
sistema legado "Minha Visita" (`import_MINHAVISITA/`).

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---|---|---|
| lat/lng | Anuláveis | PDVs importados sem coords; gerente preenche depois via CRUD |
| Sistema de acesso | Fechado | Só emails pré-cadastrados pelo admin conseguem logar |
| Pré-cadastro | Admin cria User sem googleId; primeiro login Google ativa | Permite atribuir carteira antes do GDD logar |
| Import | Script idempotente (upsert por nome), CSV customers apenas | Visitas.csv tem encoding quebrado e não tem emails |
| Carteira | Atribuição manual via UI (admin/gerente) | Visitas.csv não tem emails para cruzamento automático |
| Sync PWA | GET /me/wallet → Dexie; network-first com fallback offline | Consistente com offline-first do CLAUDE.md |

---

## 1. Schema — alterações ao `db/prisma/schema.prisma`

### Pdv — lat/lng anuláveis

```prisma
model Pdv {
  id        String   @id @default(uuid())
  name      String
  document  String?
  address   String?
  latitude  Float?          // era Float — agora nullable
  longitude Float?          // era Float — agora nullable
  radiusM   Int      @default(120)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  assignments PdvAssignment[]
  visits      Visit[]

  @@index([latitude, longitude])
}
```

### User — googleId já é nullable; adicionar flag de pré-cadastro via `active`

Sem campo novo. Convenção:
- `active: false` + `googleId: null` = pré-cadastrado, nunca logou
- `active: true`  + `googleId: <id>` = ativo
- `active: false` + `googleId: <id>` = desativado pelo admin

**Migration:** `alter_pdv_coords_nullable`

---

## 2. Auth — sistema fechado

### Novo fluxo `POST /auth/google`

```
1. Verificar token Google (tokeninfo + userinfo) — igual ao Sprint 1
2. Buscar User por googleId
   → encontrou: login normal
3. Não encontrou por googleId → buscar por email
   → email existe (active=false, googleId=null):
       - linkar googleId
       - setar active=true
       - retornar accessToken + user
   → email NÃO existe:
       - retornar 403 { error: "Conta não autorizada. Solicite acesso ao administrador." }
```

**Impacto:** contas já existentes (criadas no Sprint 1 com googleId) não sofrem mudança.
Novas contas @laboratoriosobral.com.br que não foram pré-cadastradas são rejeitadas.

---

## 3. API — endpoints

### PDVs (GERENTE + ADMIN)

```
GET    /pdvs                  Lista paginada. Query: ?page, ?pageSize, ?noCoords=true, ?q=nome
POST   /pdvs                  Cria PDV { name, address?, latitude?, longitude?, radiusM?, document? }
GET    /pdvs/:id              Detalhe do PDV
PATCH  /pdvs/:id              Edita campos parciais
DELETE /pdvs/:id              Remove (soft: seta active=false)
```

### Carteira (GERENTE + ADMIN)

```
GET    /users/:id/wallet         Lista PDVs atribuídos ao usuário
POST   /users/:id/wallet         Atribui PDV { pdvId }  — upsert (ignora duplicata)
DELETE /users/:id/wallet/:pdvId  Remove PDV da carteira
```

### Gestão de usuários (ADMIN only)

```
GET    /users                    Lista usuários (já existe — estender filtros)
POST   /users                    Pré-cadastra { name, email, role }
PATCH  /users/:id                Edita { name?, role?, active? }
DELETE /users/:id                Desativa (seta active=false, não remove)
```

### PWA sync (GDD autenticado)

```
GET    /me/wallet                Retorna PDVs da carteira do GDD logado
                                 Response: [{ id, name, address, latitude, longitude, radiusM }]
```

### Contratos Zod (packages/shared)

```typescript
export const PdvInput = z.object({
  name: z.string().min(1),
  document: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusM: z.number().int().min(10).optional(),
});

export const PdvDto = z.object({
  id: z.string(),
  name: z.string(),
  document: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  radiusM: z.number(),
  active: z.boolean(),
});

export const CreateUserInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: RoleSchema,
});

export const WalletItemDto = PdvDto.pick({
  id: true, name: true, address: true, latitude: true, longitude: true, radiusM: true,
});
```

---

## 4. Import script

**Arquivo:** `scripts/import-minha-visita.ts`

**Execução:**
```bash
# Local dev
docker compose -f docker-compose.dev.yml exec api \
  npx tsx /app/scripts/import-minha-visita.ts

# VPS
docker compose -f docker-compose.yml -f docker-compose.vps.yml exec api \
  npx tsx /app/scripts/import-minha-visita.ts
```

**Fonte:** `import_MINHAVISITA/customers_6233780.csv`
- Encoding: UTF-8 com BOM
- Separador: `;`
- Colunas usadas: `Nome` → `name`, `Endereco` → `address`
- Colunas ignoradas: Status, Último Check, Contato de, Criado por, datas

**Comportamento:**
```
Para cada linha do CSV:
  - upsert por name (não duplica em reexecução)
  - latitude=null, longitude=null, radiusM=120
  - active=true

Output: "✓ criados: N | já existiam: N | erros: N"
```

**Nota:** `Visitas.csv` não é processado (encoding latin-1 quebrado, sem emails de GDDs).
A carteira é atribuída manualmente via UI.

---

## 5. Admin UI

### Navegação

Adicionar no `App.tsx`:
```
/admin/pdvs       → PdvListPage    (GERENTE + ADMIN)
/admin/usuarios   → UserListPage   (ADMIN only)
/admin/carteira   → WalletPage     (GERENTE + ADMIN)
```

Link de navegação na `HomePage` por papel.

### `/admin/pdvs` — tabela de PDVs

- Tabela: Nome | Endereço | Raio | Coords | Status | Ações
- Badge laranja "sem coords" em PDVs com latitude=null
- Botão "+ PDV" → modal com formulário (campos: nome, endereço, lat, lng, raio, CNPJ)
- Editar (ícone) → abre o mesmo modal preenchido
- Desativar (toggle) → PATCH /pdvs/:id { active: false }
- Filtro "Mostrar apenas sem coordenadas"
- Paginação (20 por página)

### `/admin/usuarios` — gestão de usuários

- Tabela: Nome | Email | Papel | Status | Ações
- Badge "pendente" (active=false + googleId=null) | "ativo" | "inativo"
- Botão "+ Usuário" → modal { nome, email, papel }
- Editar papel → dropdown inline
- Desativar/Reativar → toggle

### `/admin/carteira` — atribuição

- Seletor de GDD (dropdown)
- Lista dos PDVs atribuídos ao GDD selecionado (com botão remover)
- Botão "+ Adicionar PDV" → modal com busca/multi-select de PDVs
- Indicador: total de PDVs na carteira

### `/wallet` — PWA do GDD

Substitui o placeholder atual.

- Carrega `GET /me/wallet` e salva resultado no Dexie (`db.wallet`)
- Exibe lista: nome do PDV + endereço
- Indicador offline/online
- Badge "sem coords" em PDVs que ainda não têm lat/lng (não aparecerá para check-in automático)
- Botão "Sincronizar" → refaz a chamada à API quando online

**Dexie schema:**
```typescript
db.version(1).stores({
  wallet: 'id, name',  // index por id e nome para busca rápida no Sprint 3
});
```

---

## 6. O que NÃO entra no Sprint 2

- Geocodificação automática de endereços
- Mapa visual para posicionar PDVs (Sprint 3+)
- Import do Visitas.csv
- Criação automática de carteira a partir do histórico
- Notificações de carteira atualizada
- Relatórios de cobertura da carteira (Sprint 6)
