/**
 * Production SSR server for TanStack Start on Bun.
 *
 * Serves pre-built static assets from dist/client/ with cache headers,
 * proxies /api/* to the API server, and falls back to SSR for all other routes.
 *
 * SSR requests are traced via OpenTelemetry — the SDK is initialized in telemetry.ts.
 * Server function hashes are resolved to readable names from the TanStack Start build manifest.
 *
 * Usage: bun run apps/web/server.ts
 */

// OTEL SDK must initialize before any other imports — registers tracer + propagators
import { sdk } from "./telemetry.ts";

import { context, propagation, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { join } from "node:path";

const tracer = trace.getTracer("basalt-ui-playground-web");

const port = Number(process.env["PORT"] ?? process.env["WEB_PORT"] ?? 7712);
const apiUrl = process.env["API_INTERNAL_URL"] ?? "http://localhost:7713";
const otelUrl = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4318";
const distDir = join(import.meta.dirname, "dist");
const clientDir = join(distDir, "client");

// Import the built SSR handler — default export has a .fetch() method
const ssrModule = await import("./dist/server/server.js");
const ssrHandler = ssrModule.default;

// Build hash → function name lookup from TanStack Start's server function manifest
// e.g. "80938e39572d..." → "getCBBIData"
const serverFnNames = new Map<string, string>();
try {
  const manifestSrc = await Bun.file(join(distDir, "server/server.js")).text();
  const entries = manifestSrc.matchAll(
    /"([a-f0-9]{40,})":\s*\{\s*functionName:\s*"(\w+)_createServerFn_handler"/g,
  );
  for (const [, hash, name] of entries) {
    serverFnNames.set(hash, name);
  }
} catch {
  // Non-critical — span names fall back to "/_serverFn"
}

const ONE_YEAR = 60 * 60 * 24 * 365;

// Paths that should not be traced (browser probes, well-known, static noise)
const SKIP_TRACE_PATHS = new Set(["/favicon.ico", "/robots.txt"]);

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    // Proxy OTLP ingest so browser SDK stays same-origin (avoids CORS to :4318)
    if (url.pathname === "/v1/traces" || url.pathname === "/v1/logs") {
      const target = new URL(url.pathname, otelUrl);
      try {
        return await fetch(target, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          // @ts-expect-error Bun supports duplex
          duplex: request.body ? "half" : undefined,
        });
      } catch {
        return new Response("OTEL collector unavailable", { status: 502 });
      }
    }

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

    // Skip tracing for non-page requests
    if (SKIP_TRACE_PATHS.has(url.pathname) || url.pathname.startsWith("/.well-known")) {
      return ssrHandler.fetch(request);
    }

    // SSR fallback — extract incoming trace context (browser → SSR link)
    const carrier = Object.fromEntries(request.headers.entries());
    const parentCtx = propagation.extract(context.active(), carrier);

    // Resolve /_serverFn/{hash} to readable function name
    const isServerFn = url.pathname.startsWith("/_serverFn/");
    let route = url.pathname;
    let serverFnName: string | undefined;
    if (isServerFn) {
      const hash = url.pathname.slice("/_serverFn/".length);
      serverFnName = serverFnNames.get(hash);
      route = serverFnName ? `/_serverFn/${serverFnName}` : "/_serverFn";
    }

    const spanName = isServerFn
      ? `ServerFn ${serverFnName ?? "unknown"}`
      : `SSR ${request.method} ${route}`;

    return context.with(parentCtx, () =>
      tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.SERVER,
          attributes: {
            // OTEL HTTP semantic conventions
            "http.request.method": request.method,
            "url.path": url.pathname,
            "url.query": url.search || undefined,
            "url.scheme": url.protocol.replace(":", ""),
            "http.route": route,
            "server.address": "localhost",
            "server.port": port,
            "user_agent.original": request.headers.get("user-agent") ?? undefined,
            "client.address": request.headers.get("x-forwarded-for") ?? undefined,
            // TanStack Start context
            ...(isServerFn && {
              "tanstack.server_fn.name": serverFnName ?? "unknown",
              "tanstack.server_fn.hash": url.pathname.slice("/_serverFn/".length),
            }),
          },
        },
        async (span) => {
          try {
            const response = await ssrHandler.fetch(request);
            span.setAttribute("http.response.status_code", response.status);

            // Detect redirects (e.g., auth guard in beforeLoad)
            if (response.status >= 300 && response.status < 400) {
              span.setAttribute(
                "http.response.redirect_location",
                response.headers.get("location") ?? "",
              );
            }

            // Mark 4xx/5xx as errors
            if (response.status >= 500) {
              span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
            }

            span.end();
            return response;
          } catch (error) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
            span.recordException(error as Error);
            span.end();
            return new Response("Internal Server Error", { status: 500 });
          }
        },
      ),
    );
  },
});

// Flush pending spans before exit so the last batch isn't lost
process.on("SIGTERM", async () => {
  await sdk.shutdown();
  process.exit(0);
});

console.log(`Web server running on http://localhost:${port}`);
