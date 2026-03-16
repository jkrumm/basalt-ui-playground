# cbbi-blueprint — Project Configuration

## Analytics (Umami)

### URL state vs custom events — the boundary

**If the state is in the URL → it's a pageview. No custom event needed.**
- Blog tag filter `?tag=blueprint` → URL change → pageview captures it
- Docs page, blog post slug → already pageviews
- Chart timeframe `?range=1Y` (if added to URL) → pageview

**If the state is ephemeral UI (not in URL) → custom event.**
- View toggle (grid/table), sort order, chart range (client-only state), pagination

Rule: ask "can I share this URL and reproduce the state?" — if yes, it belongs in the URL, not an event.

### Event naming convention

**Format:** `snake_case`, Object-Action past tense.
**Always include `component`** as a property (not in the event name itself).

```ts
track(EVENTS.TABLE_SORTED,     { component: 'indicator-grid', value: 'value-asc' })
track(EVENTS.VIEW_TOGGLED,     { component: 'indicator-grid', view: 'table' })
track(EVENTS.TIMEFRAME_CHANGED,{ component: 'cbbi-chart', value: '1Y' })
track(EVENTS.SEARCH_QUERY,     { query: 'rupl', result_count: 3 })
```

Never encode component into the event name (`indicator_grid_table_sorted` is bad).
Fewer event names with richer properties beats many narrow event names.

### Two tracking patterns

**Declarative** — `data-umami-event` attributes on Blueprint components. Auto-fires on click.
```tsx
<Button data-umami-event="outbound-click" data-umami-event-destination="github">
  GitHub
</Button>
```
Use for: CTAs, outbound links, nav buttons — anything with a static label.

**Programmatic** — `track()` from `src/lib/analytics.ts` in event handlers or `useEffect`.
```ts
import { track, EVENTS } from '../lib/analytics'
track(EVENTS.VIEW_TOGGLED, { component: 'indicator-grid', view: 'table' })
```
Use for: interactions with dynamic values (sort, view mode, chart timeframe, search query).

### Auto-tracked (no code needed)
- Pageviews on every route change (RouteTracker in `__root.tsx`)
- Inbound UTM params — captured automatically by Umami
- Blog tag filter — `?tag=` search param in URL → captured as pageview URL
- Blog post views — `/blog/$slug` URL captures the post

### Scroll depth
Fires at 25/50/75/100% on all `PageLayout` pages (/, /blog, /docs, /search). NOT on /table.
Per-section scroll tracking is non-standard and creates event catalog bloat — don't add it.

### URL state — TanStack Router search params

This project uses TypeBox (`@sinclair/typebox`) for schema validation. Use `Value.Default` +
`Value.Check` from `@sinclair/typebox/value` for `validateSearch` — no adapter package needed:
```ts
import { Type, type Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const BlogSearch = Type.Object({
  tag: Type.String({ default: '' }),
})
type BlogSearch = Static<typeof BlogSearch>

export const Route = createFileRoute('/blog/')({
  validateSearch: (search: Record<string, unknown>): BlogSearch => {
    const result = Value.Default(BlogSearch, { ...search })
    return Value.Check(BlogSearch, result) ? result as BlogSearch : { tag: '' }
  },
  // loaderDeps only needed if the loader uses the param:
  // loaderDeps: ({ search }) => ({ tag: search.tag }),
})
```

Read in component: `const { tag } = Route.useSearch()`
Navigate: `<Link to="/blog" search={{ tag }}>` — all Links to a route with `validateSearch` MUST include `search`
Toggle: `search={{ tag: activeTag === tag ? '' : tag }}` — empty string = "all"

**Never** use `useState` for filter state that belongs in the URL.
**Never** use Zod — project uses TypeBox.

### Rules
- **Never** create a TrackedButton wrapper — use data attributes on Blueprint Button instead.
- **Never** add custom events for things already captured as pageviews.
- **Never** encode component into event name — use `component` property instead.
