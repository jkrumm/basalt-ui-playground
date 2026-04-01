import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";

import { env } from "./env.ts";

export const traceExporter = new OTLPTraceExporter({
  url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
});

// Passed to the @elysiajs/opentelemetry plugin — NodeSDK handles resource creation
export const telemetryConfig = {
  serviceName: env.OTEL_SERVICE_NAME,
  traceExporter,
};

// Manual tracer for custom spans in route handlers
export const tracer = trace.getTracer("cbbi-api");
