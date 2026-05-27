FROM node:22-alpine AS base
ENV PNPM_HOME=/usr/local/bin
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache libc6-compat

# Prune workspace to only web's deps
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune web --docker

# Install deps from pruned lockfile
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
ENV SKIP_ENV_VALIDATION=1
RUN pnpm turbo build --filter=web

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
