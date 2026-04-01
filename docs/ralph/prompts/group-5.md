# Group 5: OpenTelemetry (API Layer)

## What You're Doing

Add full OpenTelemetry instrumentation to the Elysia API — automatic route spans via `@elysiajs/opentelemetry`, OTLP export configured for HyperDX ClickStack, and custom span patterns for DB operations. Do NOT start or configure HyperDX containers — just wire up the SDK/exporter.

---

## Research & Exploration First

1. Research: @elysiajs/opentelemetry latest version and configuration API
2. Research: @opentelemetry/sdk-node compatibility with Bun runtime
3. Research: OTLP HTTP exporter packages (`@opentelemetry/exporter-trace-otlp-proto` or `@opentelemetry/exporter-trace-otlp-http`)
4. Research: BatchSpanProcessor configuration for development (shorter intervals)
5. Research: What auto-instrumentation works on Bun vs Node (postgres, HTTP, etc.)
6. Read the existing telemetry setup in the current codebase for reference

---

## What to Implement

### 1. Add Dependencies

Add to `apps/api/package.json`:
- `@elysiajs/opentelemetry`
- `@opentelemetry/sdk-node` (or minimal subset that works on Bun)
- `@opentelemetry/exporter-trace-otlp-proto` (OTLP HTTP exporter)
- `@opentelemetry/api` (for manual spans)
- `@opentelemetry/resources` + `@opentelemetry/semantic-conventions`

Research which OTEL packages are actually needed — `@elysiajs/opentelemetry` may bundle some.

### 2. src/telemetry.ts — OTEL Setup

```typescript
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

// Export configuration for use in Elysia plugin
export const telemetryConfig = {
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
      })
    ),
  ],
  resource: new Resource({
    [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),
};
```

Note: The exact integration with `@elysiajs/opentelemetry` plugin may differ. Research the plugin's expected config shape.

### 3. Wire into app.ts

```typescript
import { opentelemetry } from "@elysiajs/opentelemetry";
// ... wire telemetryConfig into the plugin
app.use(opentelemetry({ /* config */ }));
```

Ensure the OTEL plugin is added BEFORE routes so all routes get instrumented.

### 4. Custom Span Helpers

Create a tracer for manual spans:

```typescript
import { trace } from "@opentelemetry/api";
const tracer = trace.getTracer("cbbi-api");
```

Add span attributes for auth context (userId) on authenticated requests. This could be done in the auth macro or via an Elysia lifecycle hook.

### 5. Environment Configuration

The env vars are already defined in `src/env.ts` from Group 2:
- `OTEL_EXPORTER_OTLP_ENDPOINT` defaults to `http://localhost:4318`
- `OTEL_SERVICE_NAME` defaults to `cbbi-api`

No API key needed — ClickStack self-hosted doesn't validate keys.

### 6. Update .env and .env.example

Ensure OTEL env vars are in `.env` defaults:
```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=cbbi-api
```

### 7. Graceful Shutdown

Ensure the span processor flushes on shutdown:
```typescript
process.on("SIGTERM", async () => {
  await spanProcessor.shutdown();
  process.exit(0);
});
```

---

## Validation

```bash
bun run --cwd apps/api src/index.ts &

# Make some API calls to generate spans
curl http://localhost:7713/api/health

# Check that the OTEL exporter doesn't crash
# (It will log connection errors to localhost:4318 if ClickStack isn't running — that's fine)
# The important thing is the API starts and serves requests without errors

kill %1
bun run typecheck
```

Note: We can't verify traces in HyperDX UI because ClickStack containers are managed separately. Validate that:
1. The API starts without OTEL-related crashes
2. Span export is configured (connection errors to :4318 are expected and acceptable)
3. TypeScript compiles clean

---

## Commit

```
feat(telemetry): add OpenTelemetry instrumentation with OTLP export
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 5
```
