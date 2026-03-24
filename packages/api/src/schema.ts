import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id').primaryKey(),
  theme: text('theme', { enum: ['light', 'dark', 'system'] }).notNull().default('system'),
  viewMode: text('view_mode', { enum: ['grid', 'table'] }).notNull().default('grid'),
  sortBy: text('sort_by', { enum: ['default', 'value-asc', 'value-desc', 'name-asc'] }).notNull().default('default'),
})
