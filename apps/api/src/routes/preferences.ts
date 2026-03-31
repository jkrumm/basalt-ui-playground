import type { PatchUserPreferences, UserPreferences } from "@cbbi/schemas";
import { eq } from "drizzle-orm";
import { db } from "../db.ts";
import { userPreferences } from "../schema.ts";

const DEFAULTS = {
  theme: "system" as const,
  viewMode: "grid" as const,
  sortBy: "default" as const,
} satisfies UserPreferences;

function toUserPreferences(row: typeof userPreferences.$inferSelect): UserPreferences {
  return { theme: row.theme, viewMode: row.viewMode, sortBy: row.sortBy };
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const [row] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  return row ? toUserPreferences(row) : DEFAULTS;
}

export async function patchPreferences(
  userId: string,
  updates: PatchUserPreferences,
): Promise<UserPreferences> {
  const fields: Partial<typeof userPreferences.$inferInsert> = {};
  if (updates.theme !== undefined) fields.theme = updates.theme;
  if (updates.viewMode !== undefined) fields.viewMode = updates.viewMode;
  if (updates.sortBy !== undefined) fields.sortBy = updates.sortBy;

  if (Object.keys(fields).length > 0) {
    const [updated] = await db
      .insert(userPreferences)
      .values({ userId, ...DEFAULTS, ...fields })
      .onConflictDoUpdate({ target: userPreferences.userId, set: fields })
      .returning();
    return toUserPreferences(updated!);
  }

  const [row] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  return row ? toUserPreferences(row) : DEFAULTS;
}
