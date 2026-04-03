import { Link, useMatchRoute } from "@tanstack/react-router";
import { Book, Dashboard, Document, Menu, Person, Search } from "@blueprintjs/icons";
import { useAtom } from "jotai";
import { mobileDrawerOpenAtom, searchOpenAtom } from "~/atoms/ui.atoms.ts";
import { authClient } from "~/lib/auth-client.ts";
import { store } from "~/lib/jotai-store.ts";
import styles from "./MobileBottomTabs.module.css";

export function MobileBottomTabs() {
  const matchRoute = useMatchRoute();
  const [, setSearchOpen] = useAtom(searchOpenAtom, { store });
  const [, setDrawerOpen] = useAtom(mobileDrawerOpenAtom, { store });
  const { data: session } = authClient.useSession();

  const isDashboardActive = !!matchRoute({ to: "/dashboard", fuzzy: true });
  const isBlogActive = !!matchRoute({ to: "/blog", fuzzy: true });
  const isDocsActive = !!matchRoute({ to: "/docs", fuzzy: true });
  const isUserActive = session
    ? !!matchRoute({ to: "/account", fuzzy: true })
    : !!matchRoute({ to: "/sign-in", fuzzy: true });

  return (
    <div className={`${styles.tabBar} flex md:hidden`}>
      <Link to="/dashboard" className={styles.tab} aria-label="Dashboard">
        <Dashboard className={isDashboardActive ? styles.tabActive : ""} />
      </Link>

      <Link to="/blog" search={{ tag: "" }} className={styles.tab} aria-label="Blog">
        <Book className={isBlogActive ? styles.tabActive : ""} />
      </Link>

      <Link to="/docs" className={styles.tab} aria-label="Docs">
        <Document className={isDocsActive ? styles.tabActive : ""} />
      </Link>

      <button
        type="button"
        className={styles.tab}
        aria-label="Search"
        onClick={() => setSearchOpen(true)}
      >
        <Search />
      </button>

      <Link
        to={session ? "/account" : "/sign-in"}
        className={styles.tab}
        aria-label="User"
      >
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
