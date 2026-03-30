import type { Theme } from "../lib/theme";
import { SegmentedControl } from "@blueprintjs/core";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "../context/theme-context";

const THEME_OPTIONS = [
  { label: "Light", value: "light", icon: <IconSun size={14} /> },
  { label: "System", value: "system", icon: <IconDeviceDesktop size={14} /> },
  { label: "Dark", value: "dark", icon: <IconMoon size={14} /> },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl
      options={THEME_OPTIONS}
      value={theme}
      onValueChange={(v) => setTheme(v as Theme)}
      size="small"
    />
  );
}
