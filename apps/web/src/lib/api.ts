import { treaty } from "@elysiajs/eden";
import { context, propagation } from "@opentelemetry/api";
import type { App } from "@basalt-ui-playground/api";

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env["API_INTERNAL_URL"] ?? "http://localhost:7713";
  }
  // Same-origin — Vite proxy in dev, reverse proxy in prod
  return "";
}

export const api = treaty<App>(getBaseUrl(), {
  fetch: { credentials: "include" },
  // Server-side: inject W3C traceparent so SSR→API calls continue the trace chain.
  // Browser-side: HyperDX patches fetch and injects traceparent via tracePropagationTargets.
  headers() {
    if (typeof window !== "undefined") return {};
    const headers: Record<string, string> = {};
    propagation.inject(context.active(), headers);
    return headers;
  },
});
