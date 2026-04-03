import { Button } from "@blueprintjs/core";
import { Link, useMatchRoute } from "@tanstack/react-router";

interface SubNavItem {
  to: string;
  label: string;
  search?: Record<string, string>;
}

interface Props {
  items: SubNavItem[];
}

export function SubNavTabs({ items }: Props) {
  const matchRoute = useMatchRoute();

  return (
    <div style={{ display: "flex", gap: 4, padding: "0 16px", borderBottom: "1px solid var(--bp-divider-color)" }}>
      {items.map((item) => {
        const isActive = !!matchRoute({ to: item.to, fuzzy: true });
        return (
          <Link
            key={item.to}
            to={item.to}
            search={item.search}
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="minimal"
              text={item.label}
              active={isActive}
              style={{ borderRadius: 0, borderBottom: isActive ? "2px solid var(--bp-intent-primary-rest)" : "2px solid transparent" }}
            />
          </Link>
        );
      })}
    </div>
  );
}
