export const EVENTS = {
  // Custom events only — things NOT auto-captured as pageviews
  SCROLL_DEPTH: 'scroll_depth', // { depth: 25|50|75|100, page: string }
  SEARCH_OPENED: 'search_opened', // {} — modal open (Cmd+K or button)
  SEARCH_QUERY: 'search_query', // { query: string, result_count: number }
  TABLE_SORTED: 'table_sorted', // { component: string, value: string }
  VIEW_TOGGLED: 'view_toggled', // { component: string, view: string }
  TIMEFRAME_CHANGED: 'timeframe_changed', // { component: string, value: string }
} as const

// Intentionally absent — captured as pageviews via RouteTracker:
//   BLOG_TAG_FILTER — tag filter is now ?tag= URL param → pageview URL captures it
//   BLOG_POST_VIEW  — /blog/$slug URL captures the post
//   CHART_SELECTED  — no chart selection UI currently

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

// SSR guard: window is undefined on server. Call sites are handlers/effects but
// guard defensively in case of future usage in component bodies.
export function track(
  event: EventName,
  data?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined')
    return
  window.umami?.track(event, data)
}
