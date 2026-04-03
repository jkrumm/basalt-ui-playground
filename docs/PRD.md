# PRD: Frontend Shell Architecture & Navigation System

## Problem

The current app uses a flat, single-shell architecture: one hardcoded `ContentNav` for all routes,
no mobile navigation, no shell polymorphism, no route metadata, layouts coupled to page components
instead of the route tree. This prevents scaling to multiple app types (dashboard, content, docs,
landing) and provides no mobile experience.

## Goal

Build a production-grade shell foundation using TanStack Start's file-based routing as the primary
coordinator. The system should:

- Support 4 distinct shell variants via pathless `_` layout routes
- Implement 3-layer navigation (L1 main, L2 contextual, L3 filters/TOC)
- Provide separate desktop and mobile navigation per shell
- Use Blueprint v6 tokens for subtle dark/light shade differentiation (inset card pattern)
- Auto-derive breadcrumbs and L2/L3 navigation from the route tree + `staticData`
- Define SSG/SSR/client-only render boundaries per route
- Enable Suspense-wrapped "Dynamic Islands" for client-only interactive elements in SSG-safe shells

## Non-Goals

- Visual polish or animations (foundation wiring only)
- New features or data routes
- Auth flow redesign (existing BetterAuth pattern preserved)
- Search implementation beyond a popover component (no `/search` route)

---

## Key Decisions

These decisions were made during the grilling phase and are final:

| # | Decision |
|-|-|
| 1 | Pathless `_` layout routes per shell — file placement determines which shell a route uses |
| 2 | 4 shells: App, Content, Docs, Landing. Auth routes go in Landing shell. Search is a popover only |
| 3 | L1 nav = reusable component, imported by each shell (NOT in root). Each shell may compose its own header from shared building blocks |
| 4 | Hybrid nav config: L1 from central `nav.config.ts`, L2/L3 derived from route `staticData` + file-based nesting |
| 5 | Breadcrumbs auto-derived from URL via `useMatches()`, skip pathless `_` segments |
| 6 | Two separate nav component trees per shell (desktop + mobile), NOT CSS responsive hacks |
| 7 | Mobile: bottom tabs (6 icon-only items for L1 main routes) + burger drawer (L2/L3 navigation) |
| 8 | SSG for specified routes (landing, content, docs), SSR default for app shell — verify SSG support with POC |
| 9 | Dynamic Islands = Suspense-wrapped client-only components with icon fallbacks in SSG-safe shells |
| 10 | Subtle shade difference between chrome and content via Blueprint color tokens — NOT opposite themes |
| 11 | Diagrams in `docs/diagrams/` are the source of truth for layout structure |
| 12 | Full refactor expected — current route structure and layout components are throwaway |
| 13 | `__root.tsx` renders nothing visual — document shell + providers only |
| 14 | Different shells may have different MainNav variants (Landing nav differs from App nav) |
| 15 | Shell wraps `<Outlet />` in an inset `ContentCard` — routes render inside it automatically |
| 16 | File-based nesting is the primary coordinator for L2 nav; `staticData` supplements with metadata |
| 17 | Stay in Blueprint v6 ecosystem for components (Drawer, Menu, Popover, etc.) |
| 18 | App shell uses `/dashboard` not `/` — Landing shell owns the root path |
| 19 | Dynamic Islands are simple Suspense wrappers for now — no morphing/animation |
| 20 | Layouts live at `route.tsx` level and wrap `<Outlet />` — individual page components do NOT import layout wrappers |

---

## Architecture

### 1. Root Route (`__root.tsx`)

Renders nothing visual — document shell and providers only:

```tsx
// __root.tsx — NO nav, NO chrome
<html>
  <head><HeadContent /></head>
  <body class={themeClass}>
    <QueryClientProvider>
      <JotaiProvider store={store}>
        <OverlaysProvider>
          <Outlet />          {/* shell renders here */}
        </OverlaysProvider>
      </JotaiProvider>
    </QueryClientProvider>
    <RouteTracker />
    <Scripts />
  </body>
</html>
```

Root `beforeLoad` handles theme cookie resolution via `getThemeFn()`. No nav, no chrome.

### 2. Four Shells

| Shell | Layout Route | Owns Path | Render Default | Description |
|-|-|-|-|-|
| **Landing** | `_landing/route.tsx` | `/` | SSG | Minimal nav, full-width content, auth pages |
| **App** | `_app/route.tsx` | `/dashboard` | SSR | Full chrome, L2 tabs, inset card, auth-gated areas |
| **Content** | `_content/route.tsx` | `/blog`, `/guides`, `/blocks` | SSG candidate | Category tabs L2, list/detail variants, TOC on detail |
| **Docs** | `_docs/route.tsx` | `/docs` | SSG candidate | Left sidebar tree, right TOC, three-column |

Each shell composes its own chrome from reusable building blocks. The `_` prefix makes these
pathless — they add layout wrapping without affecting the URL.

### 3. Route File Tree

```
routes/
├── __root.tsx                        # Document shell + providers
│
├── _landing/                         # Landing Shell (SSG)
│   ├── route.tsx                     # LandingShell: LandingNav + full-width Outlet
│   ├── index.tsx                     # / (landing page)
│   ├── sign-in.tsx                   # /sign-in
│   ├── sign-up.tsx                   # /sign-up
│   ├── changelog.tsx                 # /changelog
│   ├── imprint.tsx                   # /imprint
│   └── feedback.tsx                  # /feedback
│
├── _app/                             # App Shell (SSR)
│   ├── route.tsx                     # AppShell: AppNav + L2 tabs + inset card + Outlet
│   ├── dashboard/
│   │   ├── route.tsx                 # Dashboard L2 layout (sub-nav if needed)
│   │   ├── index.tsx                 # /dashboard
│   │   └── stats.tsx                 # /dashboard/stats
│   ├── table.tsx                     # /table
│   └── _protected/                   # Auth-gated nested layout
│       ├── route.tsx                 # beforeLoad auth guard
│       ├── account.tsx               # /account
│       └── settings.tsx              # /settings
│
├── _content/                         # Content Shell (SSG candidate)
│   ├── route.tsx                     # ContentShell: ContentNav + category L2 tabs + Outlet
│   ├── blog/
│   │   ├── route.tsx                 # BlogLayout: list/detail layout with TOC on detail
│   │   ├── index.tsx                 # /blog
│   │   └── $slug.tsx                 # /blog/:slug
│   ├── guides/
│   │   ├── route.tsx                 # GuidesLayout
│   │   ├── index.tsx                 # /guides
│   │   └── $slug.tsx                 # /guides/:slug
│   └── blocks/
│       ├── route.tsx                 # BlocksLayout
│       ├── index.tsx                 # /blocks
│       └── $slug.tsx                 # /blocks/:slug
│
├── _docs/                            # Docs Shell (SSG candidate)
│   ├── route.tsx                     # DocsShell: DocsNav + sidebar tree + TOC + Outlet
│   └── docs/
│       ├── index.tsx                 # /docs
│       └── $.tsx                     # /docs/* (splat)
│
└── $.tsx                             # 404 catch-all
```

Key properties:
- `_` prefix = pathless (no URL segment). `_app/dashboard/index.tsx` resolves to `/dashboard`
- `route.tsx` files are layout routes — they persist across child navigation (no remount)
- `_protected/` nests inside `_app/` — auth guard applies only to its children
- Content sub-sections (`blog/route.tsx`) own their list/detail layout via `<Outlet />`
- Individual page components (e.g., `$slug.tsx`) do NOT import layout wrappers — they render content only

### 4. Route `staticData` Type

```ts
// Augment TanStack Router's StaticDataRouteOption globally
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    nav?: {
      label: string;
      icon?: IconName;           // Blueprint icon name
      description?: string;
      order?: number;            // Sort priority within its level
      level: 1 | 2 | 3;
      group?: string;            // For grouped L1 secondary items
      hideFromNav?: boolean;     // e.g., $slug routes shouldn't appear in nav
      breadcrumb?: string;       // Override auto-derived breadcrumb label
    };
  }
}
```

Each route declares its navigation metadata via `staticData`. Example:

```ts
export const Route = createFileRoute("/_app/dashboard/stats")({
  staticData: {
    nav: { label: "Stats", icon: "chart", level: 2, order: 2 },
  },
  component: StatsPage,
});
```

### 5. Navigation Config

L1 main items defined centrally (they rarely change and need explicit ordering):

```ts
// lib/nav.config.ts
import type { IconName } from "@blueprintjs/icons";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  order: number;
}

export const l1MainRoutes = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", order: 1 },
  { to: "/blog",      label: "Blog",      icon: "book",      order: 2 },
  { to: "/docs",      label: "Docs",      icon: "document",  order: 3 },
] as const satisfies NavItem[];

export const l1SecondaryRoutes = [
  { to: "/changelog", label: "Changelog", icon: "history",  order: 10 },
  { to: "/feedback",  label: "Feedback",  icon: "comment",  order: 11 },
  { to: "/imprint",   label: "Imprint",   icon: "info-sign", order: 12 },
] as const satisfies NavItem[];
```

L2/L3 items are derived at render time from child route `staticData` — no central config needed.

### 6. Reusable Navigation Building Blocks

```
components/shell/
├── nav/
│   ├── MainNavBar.tsx            # Top bar container: logo + slots + dynamic islands
│   ├── MainNavLinks.tsx          # L1 link items (reads nav config, highlights active)
│   ├── SecondaryNavLinks.tsx     # L1 secondary items (changelog, imprint, etc.)
│   ├── SubNavTabs.tsx            # L2 horizontal tabs (derived from child route staticData)
│   ├── DynamicIsland.tsx         # Suspense wrapper for client-only islands
│   ├── UserIsland.tsx            # Client-only: session, login/logout, theme toggle
│   ├── NotificationsIsland.tsx   # Client-only: notification history
│   ├── StatusIsland.tsx          # Client-only: version, server health, sync tooltip
│   ├── SearchPopover.tsx         # Cmd+K search popover (replaces SearchModal + /search route)
│   └── Breadcrumbs.tsx           # Auto-derived from useMatches(), skips _ segments
├── mobile/
│   ├── MobileBottomTabs.tsx      # 6-icon bottom tab bar (L1 main routes)
│   ├── MobileDrawer.tsx          # Slide-in drawer for L2/L3 navigation
│   └── MobileDrawerTrigger.tsx   # Menu icon in bottom tabs that opens drawer
├── ContentCard.tsx               # Inset card wrapper around <Outlet />
├── ShellContainer.tsx            # Outer chrome wrapper (subtle darker shade background)
└── ThreeColumnLayout.tsx         # Docs-style: left sidebar + content + right TOC
```

### 7. Shell Composition Examples

**App Shell:**

```tsx
// _app/route.tsx
function AppShell() {
  return (
    <ShellContainer>
      {/* Desktop */}
      <MainNavBar variant="app">
        <MainNavLinks />
        <DynamicIsland><SearchPopover /></DynamicIsland>
        <DynamicIsland><NotificationsIsland /></DynamicIsland>
        <DynamicIsland><StatusIsland /></DynamicIsland>
        <DynamicIsland><UserIsland /></DynamicIsland>
      </MainNavBar>
      <SubNavTabs />
      <ContentCard>
        <Outlet />
      </ContentCard>

      {/* Mobile */}
      <MobileBottomTabs />
      <MobileDrawer />
    </ShellContainer>
  );
}
```

**Landing Shell:**

```tsx
// _landing/route.tsx
function LandingShell() {
  return (
    <ShellContainer>
      <MainNavBar variant="landing">
        <MainNavLinks />
        <DynamicIsland><UserIsland /></DynamicIsland>
      </MainNavBar>
      <Outlet />    {/* full-width, no ContentCard wrapper */}

      <MobileBottomTabs />
      <MobileDrawer />
    </ShellContainer>
  );
}
```

**Content Shell:**

```tsx
// _content/route.tsx
function ContentShell() {
  return (
    <ShellContainer>
      <MainNavBar variant="content">
        <MainNavLinks />
        <DynamicIsland><SearchPopover /></DynamicIsland>
        <DynamicIsland><UserIsland /></DynamicIsland>
      </MainNavBar>
      <SubNavTabs />            {/* Blog | Guides | Blocks tabs */}
      <ContentCard>
        <Outlet />              {/* BlogLayout/GuidesLayout/BlocksLayout renders here */}
      </ContentCard>

      <MobileBottomTabs />
      <MobileDrawer />
    </ShellContainer>
  );
}
```

**Docs Shell:**

```tsx
// _docs/route.tsx
function DocsShell() {
  return (
    <ShellContainer>
      <MainNavBar variant="docs">
        <MainNavLinks />
        <DynamicIsland><SearchPopover /></DynamicIsland>
        <DynamicIsland><UserIsland /></DynamicIsland>
      </MainNavBar>
      <ThreeColumnLayout>
        <DocsSidebar />         {/* Left: tree nav */}
        <ContentCard>
          <Outlet />
        </ContentCard>
        <TableOfContents />     {/* Right: heading nav */}
      </ThreeColumnLayout>

      <MobileBottomTabs />
      <MobileDrawer />
    </ShellContainer>
  );
}
```

### 8. Inset Card Pattern — Blueprint Tokens

The visual pattern: shell chrome (nav, sidebar, background) uses a subtly darker shade,
content area sits in a lighter card. Same theme throughout — NOT opposite themes.

```css
/* ShellContainer — subtle darker shade for chrome areas */
.shell-container {
  background-color: var(--bp-surface-background-color-default-rest);
}

:global(.bp6-dark) .shell-container {
  background-color: var(--bp-palette-dark-gray-2);
}

/* ContentCard — lighter content area with elevation */
.content-card {
  background-color: var(--bp-palette-white);
  border-radius: var(--bp-border-radius);
  box-shadow: var(--bp-elevation-shadow-1);
}

:global(.bp6-dark) .content-card {
  background-color: var(--bp-palette-dark-gray-4);
}
```

### 9. Mobile Strategy

Two separate component trees per shell. Visibility toggled via Tailwind responsive classes
(`hidden md:flex` / `flex md:hidden`). No JS media queries needed — both trees are SSG/SSR safe.

| Component | Desktop | Mobile |
|-|-|-|
| **L1 Nav** | `MainNavBar` (horizontal top bar, text + icon links) | `MobileBottomTabs` (6 icon-only tabs, fixed bottom) |
| **L2 Nav** | `SubNavTabs` (horizontal tabs below header) | Inside `MobileDrawer` (slide-in panel) |
| **L3 Nav** | Inline (filters, TOC sidebar) | Inside `MobileDrawer` or collapsed |
| **Dynamic Islands** | In `MainNavBar` header area | Select islands in bottom tabs (User icon) |

**Mobile bottom tabs (6 items):** Dashboard, Blog, Docs, Search, Notifications, Menu (burger)

The burger tab opens `MobileDrawer` which shows L2/L3 navigation for the current shell context.

Blueprint's `Drawer` component from `@blueprintjs/core` handles the slide-in panel. Verify
availability in v6 during implementation — fallback to `Dialog` with slide animation if needed.

### 10. Rendering Strategy

| Route Group | Mode | Rationale |
|-|-|-|
| `_landing/*` | SSG | Static content, no dynamic data |
| `_content/blog/*`, `guides/*`, `blocks/*` | SSG candidate | MDX compiled at build time via content-collections |
| `_docs/*` | SSG candidate | Static docs content |
| `_app/dashboard/*` | SSR | Dynamic API data |
| `_app/_protected/*` | SSR | Auth-required |
| Charts, tickers, live data | `ssr: false` or deferred | Heavy client JS, no SSR benefit |

**Dynamic Islands in nav** use Suspense boundaries — render icon fallbacks during SSG/SSR,
hydrate with interactive content client-side:

```tsx
<Suspense fallback={<Icon icon="user" />}>
  <UserIsland />
</Suspense>
```

**Deferred data pattern for dashboard:**

```tsx
// Route loader — critical data awaited, optional data deferred
loader: async ({ context: { queryClient } }) => {
  const critical = queryClient.ensureQueryData(dashboardOverviewQuery);
  const deferred = queryClient.prefetchQuery(chartDataQuery); // don't await
  await critical;
  return { deferred };
}

// Component — deferred data streamed in
<Suspense fallback={<ChartSkeleton />}>
  <Await promise={deferred}>
    {(data) => <Chart data={data} />}
  </Await>
</Suspense>
```

### 11. Breadcrumbs

Auto-derived from `useMatches()`, skipping pathless `_` layout segments:

```tsx
function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter(m => !m.id.includes("/_"))
    .filter(m => m.staticData?.nav?.breadcrumb || m.pathname !== "/")
    .map(m => ({
      label: m.staticData?.nav?.breadcrumb ?? humanize(m.pathname),
      to: m.fullPath,
    }));

  return <BreadcrumbBar items={crumbs} />;
}
```

Produces paths like: `Dashboard > Stats` or `Blog > Article Title`

### 12. Navigation Layers by Shell

| Shell | L1 | L2 | L3 |
|-|-|-|-|
| **Landing** | Top bar: Dashboard, Blog, Docs | None | None |
| **App** | Top bar: Dashboard, Blog, Docs | Horizontal tabs below header (derived from child routes) | View filters, tab controls (route-specific) |
| **Content** | Top bar: Dashboard, Blog, Docs | Category tabs: Blog, Guides, Blocks | TOC sidebar on detail views, tag filters on list views |
| **Docs** | Top bar: Dashboard, Blog, Docs | Sidebar tree navigation (section-grouped docs) | Right-side TOC (heading nav) |

L1 secondary routes (Changelog, Feedback, Imprint) appear in footer or mobile drawer — not in the main top bar.

---

## Diagrams

Refer to `docs/diagrams/` for visual layout specifications:

| Diagram | Description |
|-|-|
| `app_shell.excalidraw` | App shell desktop: header, L2 tabs, L3 filters sidebar, content area, properties panel |
| `app_shell_mobile.excalidraw` | App shell mobile: bottom nav, menu drawer, single-column outlet |
| `content_shell_list.excalidraw` | Content shell list view: header, L2 category tabs, content list |
| `content_shell_view.excalidraw` | Content shell detail view: header, L2 tabs, content area |
| `content_shell_view_mobile.excalidraw` | Content shell mobile: hero image, title, bottom nav, drawer |
| `docs_shell.excalidraw` | Docs shell: header, sidebar tree nav, content area |

---

## Current State — What Gets Removed

The following existing code is replaced by this architecture:

| Current | Replacement |
|-|-|
| `components/layout/ContentNav.tsx` | Shell-specific nav compositions from `components/shell/nav/` |
| `components/layout/PageLayout.tsx` | `ShellContainer` + `ContentCard` |
| `components/content/DocsLayout.tsx` | `_docs/route.tsx` (ThreeColumnLayout) + `DocsSidebar` in shell |
| `components/content/BlogLayout.tsx` | `_content/blog/route.tsx` (layout at route level) |
| `components/content/GuideLayout.tsx` | `_content/guides/route.tsx` (layout at route level) |
| `components/content/BlockLayout.tsx` | `_content/blocks/route.tsx` (layout at route level) |
| `components/content/SearchModal.tsx` | `components/shell/nav/SearchPopover.tsx` |
| `routes/_content.tsx` (no-op passthrough) | `_content/route.tsx` (actual ContentShell layout) |
| `routes/index.tsx` (dashboard at `/`) | `_app/dashboard/index.tsx` at `/dashboard` |
| `routes/sign-in.tsx`, `sign-up.tsx` | `_landing/sign-in.tsx`, `_landing/sign-up.tsx` |
| `routes/table.tsx` | `_app/table.tsx` |
| `routes/_protected.tsx` | `_app/_protected/route.tsx` |

---

## Open Risks

| Risk | Mitigation |
|-|-|
| TanStack Start SSG support may be limited | Verify with POC spike first; fall back to SSR with aggressive caching |
| Blueprint `Drawer` may behave differently in v6 | Verify during implementation; fallback to `Dialog` with slide CSS |
| `staticData` type augmentation may not propagate to generated route tree | Test early; fallback to explicit `staticData` per route |
| 4 shells x 2 nav variants = 8 layout combos | Keep building blocks granular; shells compose, don't duplicate |
| Content-collections + SSG interaction | Content-collections runs at build time already; verify route-level SSG config |

---

## Implementation Groups (RALPH)

Dependency-ordered groups for autonomous implementation:

| Group | Scope | Depends On |
|-|-|-|
| **G1: Foundation** | `staticData` type augmentation, `nav.config.ts`, `ShellContainer`, `ContentCard`, theme token CSS, `DynamicIsland` wrapper | — |
| **G2: Root Refactor** | Strip `__root.tsx` to document shell only, remove `ContentNav` import | G1 |
| **G3: Landing Shell** | `_landing/route.tsx` + `LandingNav`, move `/`, auth, and static routes | G2 |
| **G4: App Shell** | `_app/route.tsx` + `AppNav` + `SubNavTabs`, move dashboard + protected routes | G2 |
| **G5: Content Shell** | `_content/route.tsx` + `ContentNav`, promote content layouts to `route.tsx`, move routes | G2 |
| **G6: Docs Shell** | `_docs/route.tsx` + `DocsNav`, `ThreeColumnLayout`, sidebar tree + TOC | G2 |
| **G7: Mobile Nav** | `MobileBottomTabs`, `MobileDrawer`, integrate into all 4 shells | G3-G6 |
| **G8: Dynamic Islands** | `UserIsland`, `NotificationsIsland`, `StatusIsland`, Suspense wrappers | G3-G6 |
| **G9: Breadcrumbs + Search** | Auto-derived `Breadcrumbs`, `SearchPopover` replacing modal + route | G3-G6 |
| **G10: SSG Verification** | Test per-route SSG config, verify hydration, deferred data patterns | G3-G6 |

Groups G3-G6 can run in parallel after G2. Groups G7-G10 can run in parallel after G3-G6.

---

## Relevant Codebase Context

- **Router config**: `apps/web/src/router.tsx` — exports `getRouter()`, manual dehydration
- **Client entry**: `apps/web/src/client.tsx` — HyperDX first, then `StartClient`
- **Atoms**: `apps/web/src/atoms/` — `themeAtom` (cookie), `searchOpenAtom`, `viewModeAtom`
- **Jotai store**: `apps/web/src/lib/jotai-store.ts` — shared store, always pass to `useAtom()`
- **Content collections**: `apps/web/content-collections.ts` — MDX compilation + heading extraction
- **Content helpers**: `apps/web/src/lib/content.ts` — sidebar, search index, prev/next
- **Auth**: `apps/web/src/lib/auth-client.ts` + `auth.functions.ts` — BetterAuth SSR session
- **Global CSS**: `apps/web/src/styles/app.css` — Blueprint imports + Tailwind + tokens
- **Blueprint**: v6 with `bp6-` prefix, `@blueprintjs/core`, `@blueprintjs/icons`, `@blueprintjs/labs`
- **Existing diagrams**: `docs/diagrams/*.excalidraw` — 6 diagrams, source of truth for layouts
