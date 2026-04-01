import type { Theme } from "../atoms/theme.ts";
import { Button } from "@blueprintjs/core";
import { useAtom } from "jotai";
import { themeAtom } from "../atoms/index.ts";
import { store } from "../lib/jotai-store.ts";

export function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom, { store });
  return (
    <Button
      variant="minimal"
      text={theme === "dark" ? "Light" : "Dark"}
      onClick={() => setTheme((theme === "dark" ? "light" : "dark") as Theme)}
    />
  );
}
