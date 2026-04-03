import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Person, Search } from "@blueprintjs/icons";
import { DocsTableOfContents } from "~/components/content/DocsTableOfContents.tsx";
import { DocsSidebar } from "~/components/content/DocsSidebar.tsx";
import { ContentCard } from "~/components/shell/ContentCard.tsx";
import { MobileBottomTabs } from "~/components/shell/mobile/MobileBottomTabs.tsx";
import { MobileDrawer } from "~/components/shell/mobile/MobileDrawer.tsx";
import { DynamicIsland } from "~/components/shell/nav/DynamicIsland.tsx";
import { MainNavBar } from "~/components/shell/nav/MainNavBar.tsx";
import { SearchPopover } from "~/components/shell/nav/SearchPopover.tsx";
import { UserIsland } from "~/components/shell/nav/UserIsland.tsx";
import { ThreeColumnLayout } from "~/components/shell/ThreeColumnLayout.tsx";
import { useReadingProgress } from "~/hooks/useReadingProgress.ts";
import { getDocsSidebar } from "~/lib/content.ts";

export const Route = createFileRoute("/_docs")({
  loader: () => ({ sections: getDocsSidebar() }),
  component: DocsShell,
});

function DocsShell() {
  const { sections } = Route.useLoaderData();
  const progress = useReadingProgress();

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "2px",
          background: "var(--bp-intent-primary-rest)",
          zIndex: 9999,
          width: `${progress}%`,
          transition: "width var(--bp-emphasis-transition-duration) linear",
          pointerEvents: "none",
        }}
      />

      <MainNavBar>
        <DynamicIsland fallback={<Search />}>
          <SearchPopover />
        </DynamicIsland>
        <DynamicIsland fallback={<Person />}>
          <UserIsland />
        </DynamicIsland>
      </MainNavBar>

      <MobileBottomTabs />
      <MobileDrawer>
        <DocsSidebar sections={sections} />
      </MobileDrawer>

      <ThreeColumnLayout
        sidebar={<DocsSidebar sections={sections} />}
        toc={<DocsTableOfContents />}
      >
        <ContentCard scrollable={false}>
          <Outlet />
        </ContentCard>
      </ThreeColumnLayout>
    </>
  );
}
