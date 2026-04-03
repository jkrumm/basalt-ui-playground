/**
 * Market data routes — CBBI, Bitcoin price, and Fear & Greed Index.
 *
 * All external API calls use tracedFetch (OTEL spans) and are cached
 * to avoid hammering upstream services on every request.
 *
 * Endpoints:
 *   GET /market/cbbi/dashboard   — Full CBBI dashboard data (indicators, history, confidence)
 *   GET /market/cbbi/indicators  — CBBI indicator list only
 *   GET /market/bitcoin/price    — Bitcoin price and market data (polled by frontend)
 *   GET /market/fear-greed       — Fear & Greed Index with full history
 */

import { SpanStatusCode, trace } from "@opentelemetry/api";
import { Elysia } from "elysia";
import { getCBBIDashboard, getCBBIIndicatorDetail, getCBBIIndicators } from "../adapters/cbbi.ts";
import { getBitcoinPrice } from "../adapters/bitcoin.ts";
import { getFearGreedIndex } from "../adapters/fear-greed.ts";

/** Record OTEL span exception and log — call before returning a 502. */
function recordUpstreamError(label: string, e: unknown) {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(e as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
  }
  console.error(`[market] ${label} upstream error:`, e);
}

// Elysia 1.4.x: use `status()` from context (not `error()`) for typed 502 responses.
// `status(502, body)` returns ElysiaCustomStatusResponse — EdenTreaty puts it in the
// `error` field (status >= 400), keeping `data` typed as the success type only.
export const marketRoutes = new Elysia({ prefix: "/market" })
  .get("/cbbi/dashboard", async ({ status }) => {
    try {
      return await getCBBIDashboard();
    } catch (e) {
      recordUpstreamError("CBBI dashboard", e);
      return status(502, { error: "CBBI dashboard service unavailable", status: 502 });
    }
  })
  .get("/cbbi/indicators", async ({ status }) => {
    try {
      return await getCBBIIndicators();
    } catch (e) {
      recordUpstreamError("CBBI indicators", e);
      return status(502, { error: "CBBI indicators service unavailable", status: 502 });
    }
  })
  .get("/cbbi/indicator/:key", async ({ params: { key }, status }) => {
    try {
      const detail = await getCBBIIndicatorDetail(key);
      if (!detail) return status(404, { error: "Unknown indicator", status: 404 });
      return detail;
    } catch (e) {
      recordUpstreamError(`CBBI indicator ${key}`, e);
      return status(502, { error: "CBBI indicator service unavailable", status: 502 });
    }
  })
  .get("/bitcoin/price", async ({ status }) => {
    try {
      return await getBitcoinPrice();
    } catch (e) {
      recordUpstreamError("Bitcoin price", e);
      return status(502, { error: "Bitcoin price service unavailable", status: 502 });
    }
  })
  .get("/fear-greed", async ({ status }) => {
    try {
      return await getFearGreedIndex();
    } catch (e) {
      recordUpstreamError("Fear & Greed", e);
      return status(502, { error: "Fear & Greed service unavailable", status: 502 });
    }
  });
