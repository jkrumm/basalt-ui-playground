import { eq } from 'drizzle-orm'
import type { UserPreferences, PatchUserPreferences } from '@cbbi/schemas'
import { db } from '../db'
import { userPreferences } from '../schema'

const DEFAULTS = {
  theme: 'system' as const,
  viewMode: 'grid' as const,
  sortBy: 'default' as const,
} satisfies UserPreferences

function toUserPreferences(row: typeof userPreferences.$inferSelect): UserPreferences {
  return { theme: row.theme, viewMode: row.viewMode, sortBy: row.sortBy }
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const result = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  })
  return result ? toUserPreferences(result) : DEFAULTS
}

export async function patchPreferences(
  userId: string,
  updates: PatchUserPreferences,
): Promise<UserPreferences> {
  // Build explicit set of only the provided fields to preserve un-patched values
  const fields: {
    theme?: 'light' | 'dark' | 'system'
    viewMode?: 'grid' | 'table'
    sortBy?: 'default' | 'value-asc' | 'value-desc' | 'name-asc'
  } = {}
  if (updates.theme !== undefined) fields.theme = updates.theme
  if (updates.viewMode !== undefined) fields.viewMode = updates.viewMode
  if (updates.sortBy !== undefined) fields.sortBy = updates.sortBy

  if (Object.keys(fields).length > 0) {
    // Insert with defaults for new users; on conflict update only provided fields
    await db
      .insert(userPreferences)
      .values({ userId, ...DEFAULTS, ...fields })
      .onConflictDoUpdate({ target: userPreferences.userId, set: fields })
  }

  const result = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  })
  return result ? toUserPreferences(result) : { ...DEFAULTS, ...fields }
}
