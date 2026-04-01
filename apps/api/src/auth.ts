import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";

import { db } from "./db.ts";
import { env } from "./env.ts";
import { account, session, user, verification } from "./schema/index.ts";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.ALLOWED_ORIGIN],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (pw) => Bun.password.hash(pw),
      verify: ({ password, hash }) => Bun.password.verify(password, hash),
    },
  },
  plugins: [openAPI()],
  rateLimit: {
    window: 60,
    max: 10,
    customRules: { "/sign-in/email": { window: 60, max: 5 } },
  },
});
