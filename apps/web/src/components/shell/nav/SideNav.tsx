import { Icon } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import { Link, useMatchRoute } from "@tanstack/react-router";
import styles from "./SideNav.module.css";

interface SideNavItem {
  to: string;
  label: string;
  icon?: IconName;
  search?: Record<string, string>;
}

interface Props {
  items: SideNavItem[];
}

export function SideNav({ items }: Props) {
  const matchRoute = useMatchRoute();

  return (
    <nav className={styles.sideNav}>
      {items.map((item) => {
        const isActive = !!matchRoute({ to: item.to, fuzzy: true });
        return (
          <Link
            key={item.to}
            to={item.to}
            search={item.search}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
          >
            {item.icon && <Icon icon={item.icon} className={styles.navItemIcon} />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
