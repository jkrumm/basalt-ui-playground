import { relations } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./schema/auth-schema.ts";

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  theme: text("theme").$type<"light" | "dark" | "system">().notNull().default("system"),
  viewMode: text("view_mode").$type<"grid" | "table">().notNull().default("grid"),
  sortBy: text("sort_by")
    .$type<"default" | "value-asc" | "value-desc" | "name-asc">()
    .notNull()
    .default("default"),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userPreferences.userId],
    references: [user.id],
  }),
}));
