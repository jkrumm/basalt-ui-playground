import { context, propagation, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("basalt-ui-playground-api");

/**
 * Fetch wrapper that creates an OTEL CLIENT span for outgoing HTTP requests.
 * Use in adapters instead of bare `fetch()` so external API calls are visible
 * in ClickStack and trace context propagates to downstream services.
 */
export async function tracedFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  const parsedUrl = new URL(url);
  const method = init?.method ?? "GET";

  return tracer.startActiveSpan(
    `${method} ${parsedUrl.hostname}${parsedUrl.pathname}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "http.request.method": method,
        "url.full": parsedUrl.href,
        "server.address": parsedUrl.hostname,
        "url.scheme": parsedUrl.protocol.replace(":", ""),
      },
    },
    async (span) => {
      try {
        const traceHeaders: Record<string, string> = {};
        propagation.inject(context.active(), traceHeaders);

        const mergedHeaders = new Headers(init?.headers);
        for (const [key, value] of Object.entries(traceHeaders)) {
          mergedHeaders.set(key, value);
        }

        const response = await fetch(url, { ...init, headers: mergedHeaders });
        span.setAttribute("http.response.status_code", response.status);
        if (response.status >= 400) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
        }
        span.end();
        return response;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    },
  );
}

/**
 * In-memory TTL cache with stale-on-error fallback and inflight deduplication.
 *
 * Inflight deduplication: concurrent cache-miss requests share one upstream call
 * instead of each firing independently. Without this, a cold start (e.g. process
 * restart in dev) with simultaneous SSR + client hydration requests would trigger
 * multiple concurrent upstream calls, exhausting rate limits immediately.
 *
 * On success: refreshes cache. On failure: returns stale data if available,
 * otherwise propagates the error.
 */
export function cached<T>(ttlMs: number, fn: () => Promise<T>): () => Promise<T> {
  let entry: { data: T; expiresAt: number } | null = null;
  let inflight: Promise<T> | null = null;

  return async () => {
    if (entry && Date.now() < entry.expiresAt) return entry.data;
    if (inflight) return inflight;

    inflight = (async () => {
      try {
        const data = await fn();
        entry = { data, expiresAt: Date.now() + ttlMs };
        return data;
      } catch (error) {
        if (entry) return entry.data;
        throw error;
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  };
}
