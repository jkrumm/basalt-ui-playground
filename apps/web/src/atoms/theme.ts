import { atomWithStorage } from "jotai/utils";

export type Theme = "light" | "dark" | "system";

// Cookie-backed storage so theme preference survives hard refreshes and SSR reads.
// Falls back to returning initialValue on server (document is undefined).
const cookieStorage = {
  getItem(key: string, initialValue: Theme): Theme {
    if (typeof document === "undefined") return initialValue;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
    const value = match?.[1];
    return value === "light" || value === "dark" || value === "system" ? value : initialValue;
  },
  setItem(key: string, value: Theme): void {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  },
  removeItem(key: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; path=/; max-age=0`;
  },
};

export const themeAtom = atomWithStorage<Theme>("theme", "system", cookieStorage);
