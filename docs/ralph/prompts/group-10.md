# Group 10: HyperDX Browser SDK (Frontend RUM + Session Replay)

## What You're Doing

Add frontend observability with @hyperdx/browser — session replay, error capture, network monitoring, and trace linking from browser to API. Also add trace context propagation in SSR server functions so SSR → API calls are traced end-to-end.

---

## Research & Exploration First

1. Research: @hyperdx/browser latest version and initialization API
2. Research: HyperDX React error boundary integration (`attachToReactErrorBoundary` or equivalent)
3. Research: HyperDX session replay privacy controls (`maskAllInputs`, `maskAllText`)
4. Research: `tracePropagationTargets` configuration — how to match EdenTreaty fetch calls
5. Research: HyperDX user identification API (`setGlobalAttributes`, `identify`, or similar)
6. Research: @opentelemetry/api for SSR trace context propagation (`propagation.inject`)
7. Read existing root layout to understand where to wire initialization

---

## What to Implement

### 1. Add Dependencies

Add to `apps/web/package.json`:
- `@hyperdx/browser`
- `@opentelemetry/api` (for SSR trace propagation)

### 2. src/lib/hyperdx.ts — HyperDX Initialization

```typescript
import HyperDX from "@hyperdx/browser";

export function initHyperDX() {
  if (typeof window === "undefined") return; // Skip SSR

  const apiKey = import.meta.env.VITE_HYPERDX_API_KEY;
  if (!apiKey) return; // Disabled if no key

  HyperDX.init({
    apiKey, // "dev" for self-hosted ClickStack
    service: "cbbi-web",
    tracePropagationTargets: [/\/api\//],
    consoleCapture: true,
    advancedNetworkCapture: true,
    // maskAllInputs: true, // Enable for sensitive pages
  });
}
```

Key points:
- Guard against SSR (typeof window check)
- `tracePropagationTargets: [/\/api\//]` — auto-injects W3C `traceparent` on API calls
- `consoleCapture: true` — captures console.error/warn
- `advancedNetworkCapture: true` — captures request/response headers and bodies
- Session replay enabled by default

### 3. Wire into Root Layout

Initialize HyperDX in `__root.tsx` on the client side:

```typescript
// In root component or useEffect
import { initHyperDX } from "../lib/hyperdx.ts";

// Call once on client mount
if (typeof window !== "undefined") {
  initHyperDX();
}
```

### 4. React Error Boundary Integration

```typescript
import { ErrorBoundary } from "react-error-boundary";
// Research: HyperDX.attachToReactErrorBoundary(ErrorBoundary);
// Wire this so React errors are automatically captured
```

### 5. SSR Trace Context Propagation

In server functions that call the API (like `getSessionFn`), inject trace context:

```typescript
import { context, propagation } from "@opentelemetry/api";

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  const headers: Record<string, string> = {};
  propagation.inject(context.active(), headers);

  const response = await fetch(`${API_URL}/api/auth/get-session`, {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      ...headers, // Includes traceparent
    },
  });
  if (!response.ok) return null;
  return response.json();
});
```

This creates a continuous trace: browser session → SSR span → API span.

### 6. User Identification

After successful sign-in, identify the user in HyperDX:

```typescript
HyperDX.setGlobalAttributes({
  userId: user.id,
  userEmail: user.email,
});
```

Wire this into the auth flow (after sign-in success or session resolution).

### 7. Environment Variables

Update `.env` and `.env.example`:
```
VITE_HYPERDX_API_KEY=dev
```

For self-hosted ClickStack, `HYPERDX_API_KEY=dev` is sufficient — it's not validated.

### 8. Integration with Route Tracker

Ensure the existing Umami RouteTracker and HyperDX don't conflict. HyperDX captures navigation events automatically via its SPA support. Verify they coexist cleanly.

---

## Validation

```bash
bun install

make dev &
# Wait for apps to start

# Verify HyperDX initializes without errors
# (Check browser console for HyperDX init messages)
# API calls should include traceparent header

# Check that the web app still works normally
curl http://localhost:7712

make kill
bun run typecheck
```

Note: Full trace verification in HyperDX UI requires ClickStack to be running — that's managed separately. Validate that:
1. HyperDX SDK initializes without errors
2. No runtime crashes from the OTEL/HyperDX integration
3. TypeScript compiles clean

---

## Commit

```
feat(observability): add HyperDX browser SDK with session replay and trace linking
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 10
```
