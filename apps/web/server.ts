/**
 * Production SSR server for TanStack Start on Bun.
 *
 * Serves pre-built static assets from dist/client/ with cache headers,
 * proxies /api/* to the API server, and falls back to SSR for all other routes.
 *
 * Usage: bun run apps/web/server.ts
 */

import { join } from "node:path";

const port = Number(process.env["PORT"] ?? process.env["WEB_PORT"] ?? 7712);
const apiUrl = process.env["API_INTERNAL_URL"] ?? "http://localhost:7713";
const distDir = join(import.meta.dirname, "dist");
const clientDir = join(distDir, "client");

// Import the built SSR handler — default export has a .fetch() method
const { default: ssrHandler } = await import("./dist/server/server.js");

const ONE_YEAR = 60 * 60 * 24 * 365;

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    // Proxy /api/* to the API server
    if (url.pathname.startsWith("/api")) {
      const target = new URL(url.pathname + url.search, apiUrl);
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set("x-forwarded-for", request.headers.get("x-forwarded-for") ?? "");
      proxyHeaders.set("x-forwarded-host", url.host);
      proxyHeaders.set("x-forwarded-proto", url.protocol.replace(":", ""));

      try {
        return await fetch(target, {
          method: request.method,
          headers: proxyHeaders,
          body: request.body,
          // @ts-expect-error Bun supports duplex
          duplex: request.body ? "half" : undefined,
        });
      } catch {
        return new Response("API unavailable", { status: 502 });
      }
    }

    // Try static files from dist/client/
    const filePath = join(clientDir, url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      const isHashed = url.pathname.includes("/assets/");
      return new Response(file, {
        headers: {
          "cache-control": isHashed
            ? `public, max-age=${ONE_YEAR}, immutable`
            : "public, max-age=3600",
        },
      });
    }

    // SSR fallback
    return ssrHandler.fetch(request);
  },
});

console.log(`Web server running on http://localhost:${port}`);
