import { z } from "zod";

export const UserPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  viewMode: z.enum(["grid", "table"]),
  sortBy: z.enum(["default", "value-asc", "value-desc", "name-asc"]),
});

export const PatchUserPreferencesSchema = UserPreferencesSchema.partial();

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type PatchUserPreferences = z.infer<typeof PatchUserPreferencesSchema>;
