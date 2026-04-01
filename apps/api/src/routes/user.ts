import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../db.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { userPreferences } from "../schema/index.ts";

const PreferencesBody = z.object({
  theme: z.string().optional(),
  viewMode: z.string().optional(),
  sortBy: z.string().optional(),
});

export const userRoutes = new Elysia({ prefix: "/user" })
  .use(authMiddleware)
  .guard({ auth: true }, (app) =>
    app
      // user/userId are non-null — beforeHandle gate guarantees it
      .get("/me", ({ user }) => user!)
      .get("/preferences", async ({ userId }) => {
        const rows = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, userId!))
          .limit(1);
        return rows[0] ?? null;
      })
      .patch(
        "/preferences",
        async ({ userId, body }) => {
          const existing = await db
            .select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId!))
            .limit(1);

          if (existing.length === 0) {
            const [created] = await db
              .insert(userPreferences)
              .values({ userId: userId!, ...body })
              .returning();
            return created;
          }

          const [updated] = await db
            .update(userPreferences)
            .set(body)
            .where(eq(userPreferences.userId, userId!))
            .returning();
          return updated;
        },
        { body: PreferencesBody },
      ),
  );
