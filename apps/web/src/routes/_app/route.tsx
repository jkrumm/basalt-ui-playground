import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Notifications, Person, Pulse, Search } from "@blueprintjs/icons";
import { ContentCard } from "~/components/shell/ContentCard.tsx";
import { MobileBottomTabs } from "~/components/shell/mobile/MobileBottomTabs.tsx";
import { MobileDrawer } from "~/components/shell/mobile/MobileDrawer.tsx";
import { Breadcrumbs } from "~/components/shell/nav/Breadcrumbs.tsx";
import { DynamicIsland } from "~/components/shell/nav/DynamicIsland.tsx";
import { MainNavBar } from "~/components/shell/nav/MainNavBar.tsx";
import { NotificationsIsland } from "~/components/shell/nav/NotificationsIsland.tsx";
import { SearchPopover } from "~/components/shell/nav/SearchPopover.tsx";
import { StatusIsland } from "~/components/shell/nav/StatusIsland.tsx";
import { SubNavTabs } from "~/components/shell/nav/SubNavTabs.tsx";
import { UserIsland } from "~/components/shell/nav/UserIsland.tsx";
import { ShellContainer } from "~/components/shell/ShellContainer.tsx";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

const APP_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/table", label: "Table" },
];

function AppShell() {
  return (
    <ShellContainer>
      <div className="hidden md:block">
        <MainNavBar>
          <DynamicIsland fallback={<Search />}>
            <SearchPopover />
          </DynamicIsland>
          <DynamicIsland fallback={<Notifications />}>
            <NotificationsIsland />
          </DynamicIsland>
          <DynamicIsland fallback={<Pulse />}>
            <StatusIsland />
          </DynamicIsland>
          <DynamicIsland fallback={<Person />}>
            <UserIsland />
          </DynamicIsland>
        </MainNavBar>
        <SubNavTabs items={APP_NAV_ITEMS} />
      </div>

      <MobileBottomTabs />
      <MobileDrawer>
        <div style={{ padding: "1rem" }}>
          <Link to="/dashboard" style={{ display: "block", padding: "0.5rem 0" }}>
            Dashboard
          </Link>
          <Link to="/table" style={{ display: "block", padding: "0.5rem 0" }}>
            Table
          </Link>
        </div>
      </MobileDrawer>

      <Breadcrumbs />
      <ContentCard>
        <Outlet />
      </ContentCard>
    </ShellContainer>
  );
}
