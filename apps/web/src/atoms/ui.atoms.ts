import type { UserPreferences } from "@basalt-ui-playground/schemas";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Session-only atoms — cleared on page close
export const searchOpenAtom = atom<boolean>(false);

// Persistent atoms — survive page refresh via localStorage
export const viewModeAtom = atomWithStorage<UserPreferences["viewMode"]>("basalt-view-mode", "grid");

export const sortByAtom = atomWithStorage<UserPreferences["sortBy"]>("basalt-sort-by", "default");
