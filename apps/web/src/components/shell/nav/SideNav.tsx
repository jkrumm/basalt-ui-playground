import { Link, useMatchRoute } from "@tanstack/react-router";
import styles from "./SideNav.module.css";

interface SideNavItem {
  to: string;
  label: string;
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
