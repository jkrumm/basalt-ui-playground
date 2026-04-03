import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Person, Search } from "@blueprintjs/icons";
import { ContentCard } from "~/components/shell/ContentCard.tsx";
import { MobileBottomTabs } from "~/components/shell/mobile/MobileBottomTabs.tsx";
import { MobileDrawer } from "~/components/shell/mobile/MobileDrawer.tsx";
import { Breadcrumbs } from "~/components/shell/nav/Breadcrumbs.tsx";
import { DynamicIsland } from "~/components/shell/nav/DynamicIsland.tsx";
import { MainNavBar } from "~/components/shell/nav/MainNavBar.tsx";
import { SearchPopover } from "~/components/shell/nav/SearchPopover.tsx";
import { SubNavTabs } from "~/components/shell/nav/SubNavTabs.tsx";
import { UserIsland } from "~/components/shell/nav/UserIsland.tsx";

export const Route = createFileRoute("/_content")({
  component: ContentShell,
});

const CONTENT_NAV_ITEMS: { to: string; label: string; search: Record<string, string> }[] = [
  { to: "/blog", label: "Blog", search: { tag: "" } },
  { to: "/guides", label: "Guides", search: { category: "", difficulty: "" } },
  { to: "/blocks", label: "Blocks", search: { category: "" } },
];

function ContentShell() {
  return (
    <>
      <MainNavBar>
        <DynamicIsland fallback={<Search />}>
          <SearchPopover />
        </DynamicIsland>
        <DynamicIsland fallback={<Person />}>
          <UserIsland />
        </DynamicIsland>
      </MainNavBar>
      <SubNavTabs items={CONTENT_NAV_ITEMS} />

      <MobileBottomTabs />
      <MobileDrawer>
        <div style={{ padding: "1rem" }}>
          <Link to="/blog" search={{ tag: "" }} style={{ display: "block", padding: "0.5rem 0" }}>
            Blog
          </Link>
          <Link
            to="/guides"
            search={{ category: "", difficulty: "" }}
            style={{ display: "block", padding: "0.5rem 0" }}
          >
            Guides
          </Link>
          <Link
            to="/blocks"
            search={{ category: "" }}
            style={{ display: "block", padding: "0.5rem 0" }}
          >
            Blocks
          </Link>
        </div>
      </MobileDrawer>

      <Breadcrumbs />
      <ContentCard scrollable={false}>
        <Outlet />
      </ContentCard>
    </>
  );
}
