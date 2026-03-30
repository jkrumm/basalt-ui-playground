import type { UserPreferences } from "@cbbi/schemas";
import { atom } from "jotai";

// Null when unauthenticated, populated from server after login (Group 8)
export const serverPreferencesAtom = atom<UserPreferences | null>(null);
