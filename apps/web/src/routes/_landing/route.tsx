import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Person } from "@blueprintjs/icons";
import { ContentCard } from "~/components/shell/ContentCard.tsx";
import { MobileBottomTabs } from "~/components/shell/mobile/MobileBottomTabs.tsx";
import { MobileDrawer } from "~/components/shell/mobile/MobileDrawer.tsx";
import { DynamicIsland } from "~/components/shell/nav/DynamicIsland.tsx";
import { MainNavBar } from "~/components/shell/nav/MainNavBar.tsx";
import { UserIsland } from "~/components/shell/nav/UserIsland.tsx";
import { ShellContainer } from "~/components/shell/ShellContainer.tsx";
import { l1MainRoutes } from "~/lib/nav.config.ts";

export const Route = createFileRoute("/_landing")({
  component: LandingShell,
});

function LandingShell() {
  return (
    <ShellContainer>
      <div className="hidden md:block">
        <MainNavBar>
          <DynamicIsland fallback={<Person />}>
            <UserIsland />
          </DynamicIsland>
        </MainNavBar>
      </div>

      <MobileBottomTabs />
      <MobileDrawer>
        <div style={{ padding: "1rem" }}>
          {l1MainRoutes.map((item) => (
            <Link key={item.to} to={item.to} style={{ display: "block", padding: "0.5rem 0" }}>
              {item.label}
            </Link>
          ))}
        </div>
      </MobileDrawer>

      <ContentCard>
        <Outlet />
      </ContentCard>
    </ShellContainer>
  );
}
