import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Person, Search } from "@blueprintjs/icons";
import { ContentCard } from "~/components/shell/ContentCard.tsx";
import { MobileBottomTabs } from "~/components/shell/mobile/MobileBottomTabs.tsx";
import { MobileDrawer } from "~/components/shell/mobile/MobileDrawer.tsx";
import { DynamicIsland } from "~/components/shell/nav/DynamicIsland.tsx";
import { MainNavBar } from "~/components/shell/nav/MainNavBar.tsx";
import { SearchPopover } from "~/components/shell/nav/SearchPopover.tsx";
import { UserIsland } from "~/components/shell/nav/UserIsland.tsx";
import { ShellContainer } from "~/components/shell/ShellContainer.tsx";
import { ThreeColumnLayout } from "~/components/shell/ThreeColumnLayout.tsx";
import { DocsSidebar } from "~/components/content/DocsSidebar.tsx";
import { getDocsSidebar } from "~/lib/content.ts";

export const Route = createFileRoute("/_docs")({
  loader: () => ({ sections: getDocsSidebar() }),
  component: DocsShell,
});

function DocsShell() {
  const { sections } = Route.useLoaderData();

  return (
    <ShellContainer>
      <div className="hidden md:block">
        <MainNavBar>
          <DynamicIsland fallback={<Search />}>
            <SearchPopover />
          </DynamicIsland>
          <DynamicIsland fallback={<Person />}>
            <UserIsland />
          </DynamicIsland>
        </MainNavBar>
      </div>

      <MobileBottomTabs />
      <MobileDrawer>
        <DocsSidebar sections={sections} />
      </MobileDrawer>

      <ThreeColumnLayout sidebar={<DocsSidebar sections={sections} />} toc={null}>
        <ContentCard>
          <Outlet />
        </ContentCard>
      </ThreeColumnLayout>
    </ShellContainer>
  );
}
