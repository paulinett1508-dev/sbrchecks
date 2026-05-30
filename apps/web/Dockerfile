# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# VITE_ vars precisam existir em build time para serem embutidas no bundle
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspaces --include-workspace-root

COPY apps/web ./apps/web
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

# Compila shared antes do Vite (main aponta para dist/index.js)
RUN cd packages/shared && npx tsc
RUN cd apps/web && npm run build

# ---- runtime stage ----
FROM nginx:stable-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
