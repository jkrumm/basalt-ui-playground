/**
 * SSR OpenTelemetry setup — import at the top of server.ts before anything else.
 *
 * Initializes the NodeSDK with a BatchSpanProcessor that exports traces to
 * ClickStack (OTLP HTTP). W3C traceparent propagation is enabled by default,
 * so `propagation.inject()` in server functions (e.g. getSessionFn) and the
 * EdenTreaty client (api.ts) work automatically once this module is loaded.
 *
 * Auth headers: OTLPTraceExporter reads OTEL_EXPORTER_OTLP_HEADERS env var
 * automatically (format: "authorization=<key>"). No manual parsing needed.
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";

const endpoint = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4318";

const exporter = new OTLPTraceExporter({
  url: `${endpoint}/v1/traces`,
  // OTEL_EXPORTER_OTLP_HEADERS env var is read automatically by the exporter
});

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({ "service.name": "basalt-ui-playground-web" }),
  spanProcessors: [new BatchSpanProcessor(exporter)],
});

sdk.start();
