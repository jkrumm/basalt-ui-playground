import type { UserPreferences } from "@cbbi/schemas";
import { atom } from "jotai";

export const serverPreferencesAtom = atom<UserPreferences | null>(null);
