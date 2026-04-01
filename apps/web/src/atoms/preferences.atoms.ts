import type { UserPreferences } from "@basalt-ui-playground/schemas";
import { atom } from "jotai";

export const serverPreferencesAtom = atom<UserPreferences | null>(null);
