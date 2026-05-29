# ---- build stage ----
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY db/prisma ./db/prisma

RUN npm install --workspaces --include-workspace-root

COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY packages/shared/src ./packages/shared/src

RUN cd apps/api && npx prisma generate && npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/db/prisma ./db/prisma
# packages/shared é referenciado via symlink em node_modules — precisa existir
COPY --from=builder /app/packages ./packages

USER app
EXPOSE 3000
CMD ["node", "dist/index.js"]
