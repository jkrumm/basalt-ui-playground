import { Icon } from "@blueprintjs/core";
import { Menu, Person, Search } from "@blueprintjs/icons";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { mobileDrawerOpenAtom, searchOpenAtom } from "~/atoms/ui.atoms.ts";
import { authClient } from "~/lib/auth-client.ts";
import { store } from "~/lib/jotai-store.ts";
import { l1MainRoutes } from "~/lib/nav.config.ts";
import styles from "./MobileBottomTabs.module.css";

export function MobileBottomTabs() {
  const matchRoute = useMatchRoute();
  const [, setSearchOpen] = useAtom(searchOpenAtom, { store });
  const [, setDrawerOpen] = useAtom(mobileDrawerOpenAtom, { store });
  const { data: session } = authClient.useSession();

  const isUserActive = session
    ? !!matchRoute({ to: "/account", fuzzy: true }) ||
      !!matchRoute({ to: "/settings", fuzzy: true })
    : !!matchRoute({ to: "/sign-in", fuzzy: true });

  return (
    <div className={styles.tabBar}>
      {l1MainRoutes.map((item) => {
        const isActive = !!matchRoute({ to: item.to, fuzzy: true });
        return (
          <Link key={item.to} to={item.to} className={styles.tab} aria-label={item.label}>
            <Icon icon={item.icon} className={isActive ? styles.tabActive : ""} />
          </Link>
        );
      })}

      <button
        type="button"
        className={styles.tab}
        aria-label="Search"
        onClick={() => setSearchOpen(true)}
      >
        <Search />
      </button>

      <Link to={session ? "/account" : "/sign-in"} className={styles.tab} aria-label="User">
        <Person className={isUserActive ? styles.tabActive : ""} />
      </Link>

      <button
        type="button"
        className={styles.tab}
        aria-label="Menu"
        onClick={() => setDrawerOpen(true)}
      >
        <Menu />
      </button>
    </div>
  );
}
