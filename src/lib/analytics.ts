export const EVENTS = {
  // Custom events only — things NOT auto-captured as pageviews
  SCROLL_DEPTH: 'scroll_depth', // { depth: 25|50|75|100, page: string }
  BLOG_TAG_FILTER: 'blog_tag_filter', // { tag: string } — state-only, no route change
  SEARCH_OPENED: 'search_opened', // {} — modal open (Cmd+K or button)
  SEARCH_QUERY: 'search_query', // { query: string, result_count: number }
  CHART_SELECTED: 'chart_selected', // { chart: string }
  SORT_CHANGED: 'sort_changed', // { value: string }
  VIEW_TOGGLED: 'view_toggled', // { view: string }
} as const

// BLOG_POST_VIEW intentionally absent — visiting /blog/$slug fires a pageview via
// RouteTracker already. The URL captures which post was viewed.

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
