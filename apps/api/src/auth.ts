import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.ts";
import { env } from "./env.ts";
import { user, session, account, verification } from "./schema/auth-schema.ts";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.ALLOWED_ORIGIN],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  rateLimit: {
    // In-memory store — resets on restart, sufficient for a POC/demo.
    // For production, swap storage to "database" or a Redis adapter.
    window: 60, // 60-second sliding window
    max: 10, // 10 auth requests per window per IP
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },
});
