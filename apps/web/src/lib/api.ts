import { treaty } from "@elysiajs/eden";
import type { App } from "@cbbi/api";

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env["API_INTERNAL_URL"] ?? "http://localhost:7713";
  }
  // Same-origin — Vite proxy in dev, reverse proxy in prod
  return "";
}

export const api = treaty<App>(getBaseUrl(), {
  fetch: { credentials: "include" },
});
