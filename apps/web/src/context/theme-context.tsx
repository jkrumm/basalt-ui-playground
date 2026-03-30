import type { Theme } from "../lib/theme";
import { createContext, use, useSyncExternalStore } from "react";

interface ThemeContextValue {
  theme: Theme; // stored preference: 'light' | 'dark' | 'system'
  effectiveTheme: "light" | "dark"; // what's actually applied to the DOM
  setTheme: (t: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  effectiveTheme: "dark",
  setTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return use(ThemeContext);
}

// Subscribes to the OS color-scheme preference.
// useSyncExternalStore handles SSR: getServerSnapshot always returns 'dark'
// so there's no hydration mismatch; React re-renders on the client if needed.
export function useSystemTheme(): "light" | "dark" {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    () => "dark", // SSR snapshot — React re-renders on client if different
  );
}
