# Multi-stage Dockerfile for the CBBI Blueprint monorepo.
# Builds both web (TanStack Start SSR) and api (Elysia) apps.
#
# Usage:
#   docker compose build
#   docker compose up -d

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/schemas/package.json packages/schemas/
RUN bun install --frozen-lockfile

# ── Stage 2: Build web app ───────────────────────────────────────────────────
FROM deps AS web-build
COPY . .
RUN cd apps/web && bun run build

# ── Stage 3: Production web image ────────────────────────────────────────────
FROM oven/bun:1 AS web
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=web-build /app/apps/web/dist ./apps/web/dist
COPY --from=web-build /app/apps/web/server.ts ./apps/web/server.ts
COPY --from=web-build /app/apps/web/package.json ./apps/web/package.json
ENV PORT=7712
EXPOSE 7712
CMD ["bun", "run", "apps/web/server.ts"]

# ── Stage 4: Production API image ────────────────────────────────────────────
FROM oven/bun:1 AS api
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY apps/api ./apps/api
ENV PORT=7713
EXPOSE 7713
CMD ["bun", "run", "apps/api/src/index.ts"]
