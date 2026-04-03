import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Person, Search } from "@blueprintjs/icons";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { ContentCard } from "~/components/shell/ContentCard.tsx";
import { MobileBottomTabs } from "~/components/shell/mobile/MobileBottomTabs.tsx";
import { MobileDrawer } from "~/components/shell/mobile/MobileDrawer.tsx";
import { DynamicIsland } from "~/components/shell/nav/DynamicIsland.tsx";
import { MainNavBar } from "~/components/shell/nav/MainNavBar.tsx";
import { SearchPopover } from "~/components/shell/nav/SearchPopover.tsx";
import { SideNav } from "~/components/shell/nav/SideNav.tsx";
import { UserIsland } from "~/components/shell/nav/UserIsland.tsx";
import { ShellContainer } from "~/components/shell/ShellContainer.tsx";
import styles from "~/components/shell/ShellContainer.module.css";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

const APP_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/table", label: "Table" },
  { to: "/chart", label: "Chart" },
];

function AppShell() {
  return (
    <ShellContainer>
      <div className="hidden md:block">
        <MainNavBar>
          <DynamicIsland fallback={<Search />}>
            <SearchPopover />
          </DynamicIsland>
          <ThemeToggle />
          <DynamicIsland fallback={<Person />}>
            <UserIsland />
          </DynamicIsland>
        </MainNavBar>
      </div>

      <div className={styles.shellBody}>
        <div className="hidden md:block md:h-full">
          <SideNav items={APP_NAV_ITEMS} />
        </div>
        <ContentCard>
          <Outlet />
        </ContentCard>
      </div>

      <MobileBottomTabs />
      <MobileDrawer>
        <SideNav items={APP_NAV_ITEMS} />
      </MobileDrawer>
    </ShellContainer>
  );
}
