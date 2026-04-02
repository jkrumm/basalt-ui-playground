/**
 * Bitcoin market data adapter — Binance public API.
 *
 * Uses the Binance 24hr ticker (1,200 req/min, no auth, no monthly cap).
 * Cached for 2 minutes with inflight deduplication via cached().
 *
 * @see https://binance-docs.github.io/apidocs/spot/en/#24hr-ticker-price-change-statistics
 */

import { cached, tracedFetch } from "../lib/traced-fetch.ts";

const BINANCE_URL = "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT";
const TWO_MINUTES = 2 * 60 * 1000;

interface BinanceTicker {
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string; // USDT (≈ USD) volume for the 24h window
}

export interface BitcoinPrice {
  usd: number;
  usd24hChange: number; // percentage, e.g. -1.90 means -1.90%
  usd24hVolume: number; // USD
}

async function fetchBitcoinPrice(): Promise<BitcoinPrice> {
  const res = await tracedFetch(BINANCE_URL);
  if (!res.ok) throw new Error(`Binance API returned ${res.status}`);
  const ticker = (await res.json()) as BinanceTicker;

  return {
    usd: parseFloat(ticker.lastPrice),
    usd24hChange: parseFloat(ticker.priceChangePercent),
    usd24hVolume: parseFloat(ticker.quoteVolume),
  };
}

export const getBitcoinPrice = cached(TWO_MINUTES, fetchBitcoinPrice);
