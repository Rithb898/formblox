FROM node:22-alpine AS base
ENV PNPM_HOME=/usr/local/bin
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache libc6-compat

# Prune workspace to only api's deps
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @repo/api --docker

# Install deps from pruned lockfile
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps ./apps
COPY --from=installer /app/packages ./packages
COPY --from=pruner /app/out/full/ .
RUN TURBO_UI=false pnpm turbo build --filter=@repo/api

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=prod

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 apiuser

COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules

USER apiuser
EXPOSE 8123
CMD ["node", "dist/index.js"]
