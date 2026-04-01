import { text } from "drizzle-orm/pg-core";
import { dbSchema, user } from "./auth-schema.ts";

export const userPreferences = dbSchema.table("user_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("dark"),
  viewMode: text("view_mode").notNull().default("grid"),
  sortBy: text("sort_by").notNull().default("default"),
});
