# ============================================================================
# Fractalis Frontend - Production Image
# Next.js + React + npm | Node 22 Alpine
# ============================================================================

FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat

# ============================================================================
# Stage 1: Instalar dependencias
# ============================================================================
FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# ============================================================================
# Stage 2: Build
# ============================================================================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* deben pasarse como --build-arg al construir la imagen
# Quedan embebidas en el JS del bundle, no son configurables en runtime
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GRAPHQL_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL

RUN npm run build

# ============================================================================
# Stage 3: Runner (imagen final mínima)
# ============================================================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Archivos estáticos públicos
COPY --from=builder /app/public ./public

# Output standalone (contiene el servidor y sus dependencias mínimas)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Assets estáticos compilados (JS, CSS, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
