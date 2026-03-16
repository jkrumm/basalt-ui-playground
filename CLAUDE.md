# cbbi-blueprint — Project Configuration

## Analytics (Umami)

Two tracking patterns — choose based on whether data is static or dynamic:

**Declarative** — add `data-umami-event` attributes directly to Blueprint components.
Umami's script auto-fires on click. No JS needed. Blueprint passes `data-*` to the DOM.
```tsx
<Button data-umami-event="outbound-click" data-umami-event-destination="github">
  GitHub
</Button>
// Additional properties: data-umami-event-<key>="<value>"
```
Use for: CTAs, outbound links, nav buttons, anything with a static label.

**Programmatic** — call `track()` from `src/lib/analytics.ts` in event handlers or `useEffect`.
Use for: events with dynamic values (filter selected, search query, scroll depth).
```ts
import { track, EVENTS } from '../lib/analytics'
track(EVENTS.SORT_CHANGED, { value: selectedValue })
```

**Auto-tracked (no code needed):**
- Pageviews on every route change (RouteTracker in __root.tsx)
- Inbound UTM params (utm_source, utm_medium, utm_campaign, etc.) — captured automatically
- Blog post views — URL captures slug (/blog/$slug is a pageview)

**Scroll depth** — fires at 25/50/75/100% on all PageLayout pages.
`PageLayout` wraps all content routes (/, /blog, /docs, /search). NOT on /table.

**Never** create a TrackedButton wrapper — use data attributes on Blueprint Button instead.
**Never** add custom events for things already captured as pageviews.
