import type { IconName } from "@blueprintjs/icons";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  order: number;
}

export const l1MainRoutes = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", order: 1 },
  { to: "/blog", label: "Blog", icon: "book", order: 2 },
  { to: "/docs", label: "Docs", icon: "document", order: 3 },
] as const satisfies NavItem[];

export const l1SecondaryRoutes = [
  { to: "/changelog", label: "Changelog", icon: "history", order: 10 },
  { to: "/feedback", label: "Feedback", icon: "comment", order: 11 },
  { to: "/imprint", label: "Imprint", icon: "info-sign", order: 12 },
] as const satisfies NavItem[];
