import type { Theme } from "../atoms/theme.ts";
import { Button, Menu, MenuItem, Popover } from "@blueprintjs/core";
import { Contrast, Flash, Moon } from "@blueprintjs/icons";
import { useAtom } from "jotai";
import { themeAtom } from "../atoms/index.ts";
import { store } from "../lib/jotai-store.ts";

const THEME_CYCLE: Theme[] = ["system", "light", "dark"];

const THEME_ICON = {
  system: <Contrast />,
  light: <Flash />,
  dark: <Moon />,
} satisfies Record<Theme, React.ReactElement>;

export function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom, { store });

  function cycleTheme() {
    const idx = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length] ?? "system");
  }

  const menu = (
    <Menu>
      <MenuItem
        icon={<Contrast />}
        text="System"
        active={theme === "system"}
        onClick={() => setTheme("system")}
      />
      <MenuItem
        icon={<Flash />}
        text="Light"
        active={theme === "light"}
        onClick={() => setTheme("light")}
      />
      <MenuItem
        icon={<Moon />}
        text="Dark"
        active={theme === "dark"}
        onClick={() => setTheme("dark")}
      />
    </Menu>
  );

  return (
    <Popover content={menu} placement="bottom-end" interactionKind="hover" hoverOpenDelay={200}>
      <Button variant="minimal" icon={THEME_ICON[theme]} aria-label="Theme" onClick={cycleTheme} />
    </Popover>
  );
}
