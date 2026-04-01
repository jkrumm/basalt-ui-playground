import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:7713"),
  ALLOWED_ORIGIN: z.url().default("http://localhost:7712"),
  PORT: z.coerce.number().default(7713),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().default("http://localhost:4318"),
  OTEL_SERVICE_NAME: z.string().default("basalt-ui-playground-api"),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
