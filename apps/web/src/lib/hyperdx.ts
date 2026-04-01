import HyperDX from "@hyperdx/browser";

let initialized = false;

export function initHyperDX() {
  if (typeof window === "undefined" || initialized) return;

  const apiKey = import.meta.env.VITE_HYPERDX_API_KEY;
  if (!apiKey) return;

  HyperDX.init({
    apiKey,
    service: import.meta.env.VITE_HYPERDX_SERVICE_NAME ?? "cbbi-web",
    tracePropagationTargets: [/\/api\//],
    consoleCapture: true,
    advancedNetworkCapture: true,
  });

  initialized = true;
}

export function identifyUser(user: { id: string; email: string; name: string }) {
  if (typeof window === "undefined") return;
  HyperDX.setGlobalAttributes({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  });
}
