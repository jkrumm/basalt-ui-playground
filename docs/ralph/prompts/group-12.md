# Group 12: Production Server + Docker

## What You're Doing

Create the production SSR server for TanStack Start on Bun, write a multi-stage Dockerfile, and create a compose.yml for the full stack (web + API + Postgres + HyperDX ClickStack). Validate that the Docker image builds and runs correctly.

---

## Research & Exploration First

1. Research: TanStack Start production deployment with Bun — there's a recommended `server.ts` pattern. Check the TanStack Start docs for Bun deployment. Do NOT assume raw `Bun.serve()` is correct.
2. Research: `oven/bun` Docker image tags — what's the latest slim variant?
3. Research: Bun.serve static file serving patterns (cache headers, compression)
4. Research: HyperDX ClickStack Docker image and compose setup — the image is `docker.hyperdx.io/hyperdx/hyperdx-all-in-one` (or the newer ClickStack image). Ports: 8080 (UI), 4317 (gRPC), 4318 (HTTP OTLP).
5. Read the existing `apps/web/server.ts` for reference patterns
6. Read the TDD for Docker strategy notes and production routing decisions

---

## What to Implement

### 1. apps/web/server.ts — Production SSR Server

Research TanStack Start's recommended Bun deployment pattern. It likely involves:
- Importing the built SSR handler
- Serving static assets from `dist/client/` with cache headers
- SSR fallback for dynamic routes
- Port from env (default 7712)

```typescript
// This is a ROUGH sketch — research the actual pattern
import { serve } from "bun";

serve({
  port: process.env.PORT ?? 7712,
  async fetch(request) {
    // 1. Try static files from dist/client/
    // 2. Fall back to SSR handler
  },
});
```

### 2. Dockerfile — Multi-Stage Build

```dockerfile
# Stage 1: Install dependencies
FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/schemas/package.json packages/schemas/
RUN bun install --frozen-lockfile

# Stage 2: Build web
FROM deps AS web-build
COPY . .
RUN bun run build

# Stage 3: Production image
FROM oven/bun:latest AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=web-build /app/apps/web/.output ./apps/web/.output
COPY --from=web-build /app/apps/web/server.ts ./apps/web/server.ts
COPY --from=deps /app/apps/api ./apps/api
COPY --from=deps /app/packages ./packages
# Runtime: separate CMD per container
```

Research:
- What's the actual build output directory for TanStack Start? (`.output/`, `dist/`, or other?)
- Does the API need a build step or runs from source?
- Use slim variant if available

### 3. compose.yml — Full Stack

```yaml
services:
  web:
    build:
      context: .
      target: production
    command: ["bun", "run", "apps/web/server.ts"]
    ports:
      - "7712:7712"
    environment:
      - API_INTERNAL_URL=http://api:7713
      - PORT=7712

  api:
    build:
      context: .
      target: production
    command: ["bun", "run", "apps/api/src/index.ts"]
    ports:
      - "7713:7713"
    environment:
      - DATABASE_URL=postgresql://cbbi:cbbi@postgres:5432/cbbi
      - BETTER_AUTH_URL=http://web:7712
      - BETTER_AUTH_SECRET=change-me-in-production-at-least-32-chars
      - ALLOWED_ORIGIN=http://localhost:7712
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://clickstack:4318
      - OTEL_SERVICE_NAME=cbbi-api
      - PORT=7713
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:17
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=cbbi
      - POSTGRES_PASSWORD=cbbi
      - POSTGRES_DB=cbbi
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cbbi"]
      interval: 5s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  clickstack:
    image: docker.hyperdx.io/hyperdx/hyperdx-all-in-one
    ports:
      - "8080:8080"   # HyperDX UI
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP

volumes:
  pgdata:
```

Note: The user manages ClickStack separately — include it in compose.yml for reference but document that it's optional.

### 4. Update Makefile

```makefile
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

start: kill build
	# Start both apps in production mode (local, not Docker)
	bun run apps/api/src/index.ts &
	bun run apps/web/server.ts &
```

### 5. Production API Routing

**Decision needed:** In Docker, the web container's SSR calls go to `http://api:7713` via Docker internal network. Browser API calls go through the same origin (need a reverse proxy or the web server must proxy `/api` to the API container).

Options:
1. Web server.ts proxies `/api/*` to `API_INTERNAL_URL` (simplest for POC)
2. Add Caddy/nginx reverse proxy (production-grade but complex)

For this POC, option 1 (web server proxies API) is recommended. Document that production deployments should use a proper reverse proxy.

---

## Validation

**IMPORTANT:** Actually build and run the Docker image.

```bash
# Build Docker image
make docker-build

# Start the stack
make docker-up

# Wait for services to be healthy
sleep 10

# Test web app
curl http://localhost:7712

# Test API
curl http://localhost:7713/api/health

# Test API through web proxy
curl http://localhost:7712/api/health

# Tear down
make docker-down

# Also validate local production mode
bun run build
# Start production servers and verify they work
```

---

## Commit

```
feat(deploy): add production server, Dockerfile, and compose stack
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 12
```
