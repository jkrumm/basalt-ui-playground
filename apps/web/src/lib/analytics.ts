// Intentionally absent — captured as pageviews via RouteTracker:
//   BLOG_TAG_FILTER — tag filter is now ?tag= URL param → pageview URL captures it
//   BLOG_POST_VIEW  — /blog/$slug URL captures the post
//   CHART_SELECTED  — no chart selection UI currently

declare global {
  interface Window {
    umami?: {
      track(event: string, data?: Record<string, string | number | boolean>): void;
    };
  }
}

interface EventPayloads {
  scroll_depth: { depth: 25 | 50 | 75 | 100; page: string };
  search_opened: Record<string, never>;
  search_query: { query: string; result_count: number };
  table_sorted: { component: string; column: string; direction: "asc" | "desc" };
  view_toggled: { component: string; view: string };
  timeframe_changed: { component: string; value: string };
  select_changed: { component: string; field: string; value: string };
}

export type EventName = keyof EventPayloads;

export const EVENTS = {
  SCROLL_DEPTH: "scroll_depth",
  SEARCH_OPENED: "search_opened",
  SEARCH_QUERY: "search_query",
  TABLE_SORTED: "table_sorted",
  VIEW_TOGGLED: "view_toggled",
  TIMEFRAME_CHANGED: "timeframe_changed",
  SELECT_CHANGED: "select_changed",
} as const satisfies Record<string, EventName>;

// SSR guard: window is undefined on server. Call sites are handlers/effects but
// guard defensively in case of future usage in component bodies.
export function track<K extends EventName>(event: K, data: EventPayloads[K]): void {
  if (typeof window === "undefined") return;
  window.umami?.track(event, data as Record<string, string | number | boolean>);
}
