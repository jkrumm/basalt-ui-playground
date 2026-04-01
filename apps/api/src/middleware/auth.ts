import { Elysia } from "elysia";

import { auth } from "../auth.ts";

// derive runs before beforeHandle — fetch session once, gate via macro
export const authMiddleware = new Elysia({ name: "auth" })
  .derive({ as: "scoped" }, async ({ request: { headers } }) => {
    const session = await auth.api.getSession({ headers });
    return {
      user: session?.user ?? null,
      userId: session?.user?.id ?? null,
    };
  })
  .macro({
    auth(enabled: boolean) {
      if (!enabled) return {};
      return {
        beforeHandle: ({ user, set }) => {
          if (!user) {
            set.status = 401;
            return "Unauthorized";
          }
        },
      };
    },
  });
