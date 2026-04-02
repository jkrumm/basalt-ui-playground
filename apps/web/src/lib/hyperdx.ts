import HyperDX from "@hyperdx/browser";

// Self-initializing side-effect module — patches window.fetch and XMLHttpRequest
// on import. Must be the FIRST import in client.tsx so the fetch patch is in place
// before any library captures it: BetterAuth's createAuthClient() and EdenTreaty's
// treaty() both wrap the current fetch at initialization time.
if (typeof window !== "undefined") {
  const apiKey = import.meta.env.VITE_HYPERDX_API_KEY;
  if (apiKey) {
    // Dev-only: filter Vite HMR client errors before HyperDX's unhandledrejection
    // listener sees them. @vite/client fires "send was called before connect" during
    // dep-optimizer rebuilds (WebSocket not yet open), generating thousands of false
    // error spans. Capture phase runs before HyperDX's bubble-phase listener, so
    // stopImmediatePropagation() fully blocks it.
    if (import.meta.env.DEV) {
      window.addEventListener(
        "unhandledrejection",
        (e) => {
          if ((e.reason as Error | undefined)?.stack?.includes("/@vite/")) {
            e.stopImmediatePropagation();
          }
        },
        { capture: true },
      );
    }

    HyperDX.init({
      apiKey,
      service: import.meta.env.VITE_HYPERDX_SERVICE_NAME ?? "basalt-ui-playground-web",
      // SDK appends /v1/logs and /v1/traces — web server proxies to OTEL collector.
      // Must be an absolute URL (OTLP exporter falls back to localhost:4318 for relative paths).
      url: import.meta.env.VITE_HYPERDX_ENDPOINT || window.location.origin,
      tracePropagationTargets: [/\/api\//, /\/_serverFn\//],
      consoleCapture: true,
      advancedNetworkCapture: true,
    });
  }
}

export function identifyUser(user: { id: string; email: string; name: string }) {
  if (typeof window === "undefined") return;
  HyperDX.setGlobalAttributes({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  });
}
