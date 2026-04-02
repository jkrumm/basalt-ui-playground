import HyperDX from "@hyperdx/browser";

// Self-initializing side-effect module — patches window.fetch and XMLHttpRequest
// on import. Must be imported BEFORE any library that captures fetch (BetterAuth, etc).
if (typeof window !== "undefined") {
  const apiKey = import.meta.env.VITE_HYPERDX_API_KEY;
  if (apiKey) {
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
