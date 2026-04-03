/**
 * TanStack Query definitions for market data endpoints.
 *
 * All queries use EdenTreaty (type-safe, auto-traced). SSR loaders call
 * ensureQueryData/prefetchQuery to populate the cache; components use
 * useQuery()/useSuspenseQuery() with optional polling (refetchInterval).
 */

import { queryOptions } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

// ---------------------------------------------------------------------------
// Type helper — extracts resolved data type from a queryOptions result
// ---------------------------------------------------------------------------

// queryFn is optional in UseQueryOptions so NonNullable strips `| undefined` before inferring.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryData<Q extends { queryFn?: (...args: any[]) => any }> =
  NonNullable<Q["queryFn"]> extends (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => infer R
    ? NonNullable<Awaited<R>>
    : never;

// ---------------------------------------------------------------------------
// CBBI
// ---------------------------------------------------------------------------

export function cbbiDashboardQuery() {
  return queryOptions({
    queryKey: ["market", "cbbi", "dashboard"] as const,
    staleTime: 60 * 60 * 1000, // 1 hour — CBBI data is daily
    queryFn: async () => {
      const { data, error } = await api.api.market.cbbi.dashboard.get();
      if (error) {
        console.error("[cbbiDashboardQuery]", error);
        throw new Error("CBBI dashboard unavailable");
      }
      return data;
    },
  });
}

export type CBBIDashboardData = QueryData<ReturnType<typeof cbbiDashboardQuery>>;

export function cbbiIndicatorsQuery() {
  return queryOptions({
    queryKey: ["market", "cbbi", "indicators"] as const,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await api.api.market.cbbi.indicators.get();
      if (error) {
        console.error("[cbbiIndicatorsQuery]", error);
        throw new Error("CBBI indicators unavailable");
      }
      return data;
    },
  });
}

export type CBBIIndicatorsData = QueryData<ReturnType<typeof cbbiIndicatorsQuery>>;

// ---------------------------------------------------------------------------
// Bitcoin price — polled every 10 seconds
// ---------------------------------------------------------------------------

export function bitcoinPriceQuery() {
  return queryOptions({
    queryKey: ["market", "bitcoin", "price"] as const,
    staleTime: 30 * 1000, // 30 seconds
    queryFn: async () => {
      const { data, error } = await api.api.market.bitcoin.price.get();
      if (error) {
        console.error("[bitcoinPriceQuery]", error);
        throw new Error("Bitcoin price unavailable");
      }
      return data;
    },
  });
}

// ---------------------------------------------------------------------------
// Per-indicator detail with historical time series
// ---------------------------------------------------------------------------

export function cbbiIndicatorDetailQuery(key: string) {
  return queryOptions({
    queryKey: ["market", "cbbi", "indicator", key] as const,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await api.api.market.cbbi.indicator({ key }).get();
      if (error) {
        console.error("[cbbiIndicatorDetailQuery]", error);
        throw new Error(`CBBI indicator "${key}" not found or unavailable`);
      }
      return data;
    },
  });
}

export type CBBIIndicatorDetailData = QueryData<ReturnType<typeof cbbiIndicatorDetailQuery>>;

// ---------------------------------------------------------------------------
// Fear & Greed Index
// ---------------------------------------------------------------------------

export function fearGreedQuery() {
  return queryOptions({
    queryKey: ["market", "fear-greed"] as const,
    staleTime: 60 * 60 * 1000, // 1 hour — updates daily
    queryFn: async () => {
      const { data, error } = await api.api.market["fear-greed"].get();
      if (error) {
        console.error("[fearGreedQuery]", error);
        throw new Error("Fear & Greed index unavailable");
      }
      return data;
    },
  });
}
