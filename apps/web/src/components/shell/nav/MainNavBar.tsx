import type { ReactNode } from "react";
import { Alignment, Button, Divider, Navbar, NavbarGroup } from "@blueprintjs/core";
import { Search } from "@blueprintjs/icons";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { searchOpenAtom } from "~/atoms/ui.atoms.ts";
import { store } from "~/lib/jotai-store.ts";
import { MainNavLinks } from "./MainNavLinks.tsx";
import styles from "./MainNavBar.module.css";

interface Props {
  children?: ReactNode;
}

export function MainNavBar({ children }: Props) {
  const [, setSearchOpen] = useAtom(searchOpenAtom, { store });

  return (
    <div className={styles.wrapper}>
      <Navbar style={{ boxShadow: "none" }}>
        <NavbarGroup align={Alignment.LEFT}>
          <Link to="/" style={{ textDecoration: "none", fontWeight: 600, marginRight: 8 }}>
            BasaltUI
          </Link>
          <Divider />
          <MainNavLinks />
        </NavbarGroup>
        <NavbarGroup align={Alignment.RIGHT}>
          <Button
            variant="minimal"
            icon={<Search />}
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          />
          {children}
        </NavbarGroup>
      </Navbar>
    </div>
  );
}
