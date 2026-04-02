/**
 * CoinGecko adapter — Bitcoin price and market data.
 *
 * Uses the free /coins/bitcoin endpoint (no API key). Rate-limited to ~10 req/min.
 * Cached for 2 minutes to stay well within rate limits. The cache has stale-on-error
 * fallback — if CoinGecko returns 429, the last successful response is returned.
 *
 * @see https://docs.coingecko.com/v3.0.1/reference/coins-id
 */

import { cached, tracedFetch } from "../lib/traced-fetch.ts";

// ---------------------------------------------------------------------------
// External API types (partial — only fields we use)
// ---------------------------------------------------------------------------

interface CoinGeckoResponse {
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    ath: Record<string, number>;
    ath_date: Record<string, string>;
    circulating_supply: number;
    max_supply: number | null;
    last_updated: string;
  };
}

// ---------------------------------------------------------------------------
// Domain types (returned by API routes)
// ---------------------------------------------------------------------------

export interface BitcoinPrice {
  usd: number;
  usd24hChange: number;
  usd7dChange: number;
  usd30dChange: number;
  usd24hVolume: number;
  marketCap: number;
  ath: number;
  circulatingSupply: number;
  maxSupply: number | null;
}

// ---------------------------------------------------------------------------
// Fetcher (cached 30s — poll-friendly without hammering CoinGecko)
// ---------------------------------------------------------------------------

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false";
const TWO_MINUTES = 2 * 60 * 1000;

async function fetchBitcoin(): Promise<BitcoinPrice> {
  const res = await tracedFetch(COINGECKO_URL);
  if (!res.ok) throw new Error(`CoinGecko API returned ${res.status}`);
  const data = (await res.json()) as CoinGeckoResponse;
  const md = data.market_data;

  return {
    usd: md.current_price["usd"] ?? 0,
    usd24hChange: md.price_change_percentage_24h,
    usd7dChange: md.price_change_percentage_7d,
    usd30dChange: md.price_change_percentage_30d,
    usd24hVolume: md.total_volume["usd"] ?? 0,
    marketCap: md.market_cap["usd"] ?? 0,
    ath: md.ath["usd"] ?? 0,
    circulatingSupply: md.circulating_supply,
    maxSupply: md.max_supply,
  };
}

export const getBitcoinPrice = cached(TWO_MINUTES, fetchBitcoin);
