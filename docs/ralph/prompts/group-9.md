# Group 9: Remaining Components + Analytics

## What You're Doing

Port the CBBI dashboard components (chart, indicator grid, table comparison), navigation, layout components, Jotai atoms, TanStack Query patterns, and Umami analytics. This completes the application's feature set.

---

## Research & Exploration First

1. Research: Recharts latest version and API (check for v3.x breaking changes)
2. Research: Blueprint v6 Table/HTMLTable component latest API
3. Research: Jotai `atomWithStorage` latest pattern
4. Read existing components to port:
   - `src/components/CBBIChart.tsx` — Recharts chart
   - `src/components/layout/ContentNav.tsx` — navigation
   - `src/components/layout/PageLayout.tsx` — page layout wrapper
5. Read existing atoms: `src/atoms/preferences.atoms.ts`, `src/atoms/ui.atoms.ts`
6. Read existing queries: `src/queries/preferences.queries.ts`
7. Read existing route files for dashboard/table pages
8. Read existing analytics setup (RouteTracker, track function, EVENTS)

---

## What to Implement

### 1. Add Dependencies

- `recharts` (for CBBI chart)
- Any other component deps needed

### 2. Port Layout Components

From `src/components/layout/`:
- `PageLayout.tsx` — wraps pages with consistent layout, scroll tracking
- `ContentNav.tsx` — navigation component

### 3. Port CBBI Chart

Port `src/components/CBBIChart.tsx` — the Recharts-based CBBI index chart. Update to latest Recharts API if needed.

### 4. Port Indicator Grid + Table

Port the indicator grid/table comparison views. These show CBBI indicators in grid or table format with sort/filter controls.

### 5. Port Jotai Atoms

Port from `src/atoms/`:
- `ui.atoms.ts` — searchOpenAtom, viewModeAtom, sortByAtom
- `preferences.atoms.ts` — user preference atoms

Rules:
- All atoms in `src/atoms/` directory
- `*Atom` suffix naming convention
- `atomWithStorage` for persisted state
- NO `atomFamily` (broken with React Compiler)
- Static atoms only

### 6. Port TanStack Query Patterns

Port from `src/queries/`:
- `preferences.queries.ts` — user preferences query with `queryOptions()`

Pattern: define with `queryOptions()`, pre-fetch in route loaders with `queryClient.ensureQueryData()`, consume with `useSuspenseQuery()`.

### 7. Port/Create Dashboard Routes

- `src/routes/index.tsx` — update landing page with CBBI chart
- `src/routes/table.tsx` — table comparison page
- Wire preferences loading in route loaders

### 8. Implement Umami Analytics

#### src/lib/analytics.ts

```typescript
export const EVENTS = {
  TABLE_SORTED: "table_sorted",
  VIEW_TOGGLED: "view_toggled",
  TIMEFRAME_CHANGED: "timeframe_changed",
  SEARCH_QUERY: "search_query",
} as const;

export function track(event: string, data?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  window.umami?.track(event, data);
}
```

#### RouteTracker

Add to root layout — tracks pageviews on every route change via TanStack Router's `useRouterState`.

#### Scroll Depth Tracking

Fires at 25/50/75/100% on PageLayout pages (/, /blog, /docs, /search). NOT on /table.

### 9. Umami Script Integration

Add Umami script tag in root layout, gated by env vars:
- `VITE_UMAMI_SCRIPT_URL`
- `VITE_UMAMI_WEBSITE_ID`

Use `data-umami-event` attributes on Blueprint components for declarative tracking.

### 10. Account Page

Create `src/routes/_protected/account.tsx` — account management page under protected routes.

---

## Validation

```bash
make dev &
# Wait for both apps to start

# Landing page renders with chart (or placeholder if no data)
curl http://localhost:7712

# Table page renders
curl http://localhost:7712/table

# Protected account page redirects to sign-in when not authenticated
curl -L http://localhost:7712/account

make kill
bun run typecheck
```

---

## Commit

```
feat(web): port dashboard components, analytics, and remaining UI
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 9
```
