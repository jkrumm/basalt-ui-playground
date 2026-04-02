import { context, propagation, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("basalt-ui-playground-web");

/**
 * Fetch wrapper that creates an OTEL span and propagates W3C traceparent for
 * outgoing HTTP requests in server functions. Use instead of bare `fetch()`
 * in createServerFn handlers so the call is visible as a child span in ClickStack
 * and the trace chain continues to the target service.
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
        // Inject W3C traceparent so the target service can continue the trace
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
