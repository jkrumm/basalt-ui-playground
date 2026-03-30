import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    // Must be set to the public app URL in production
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    BETTER_AUTH_SECRET: z.string().min(32),
    ALLOWED_ORIGIN: z.url().default("http://localhost:3000"),
    PORT: z.coerce.number().default(3001),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
