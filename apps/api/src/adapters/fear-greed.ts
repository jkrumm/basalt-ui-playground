/**
 * Fear & Greed Index adapter — crypto market sentiment from Alternative.me.
 *
 * Returns a 0-100 score with classification (Extreme Fear → Extreme Greed).
 * Full history available (daily since Feb 2018). Cached for 1 hour since
 * the index updates once daily.
 *
 * @see https://alternative.me/crypto/fear-and-greed-index/
 */

import { cached, tracedFetch } from "../lib/traced-fetch.ts";

// ---------------------------------------------------------------------------
// External API types
// ---------------------------------------------------------------------------

interface FNGRawEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

interface FNGRawResponse {
  data: FNGRawEntry[];
  metadata: { error: string | null };
}

// ---------------------------------------------------------------------------
// Domain types (returned by API routes)
// ---------------------------------------------------------------------------

export interface FearGreedEntry {
  value: number;
  classification: string;
  date: string;
}

export interface FearGreedData {
  current: FearGreedEntry;
  history: FearGreedEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseEntry(raw: FNGRawEntry): FearGreedEntry {
  const date = new Date(Number.parseInt(raw.timestamp) * 1000);
  return {
    value: Number.parseInt(raw.value),
    classification: raw.value_classification,
    // Non-ISO format: TanStack Start's $R serializer converts YYYY-MM-DD strings
    // to Date objects during SSR hydration, breaking React rendering.
    date: date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  };
}

// ---------------------------------------------------------------------------
// Fetcher (cached 1h — index updates daily)
// ---------------------------------------------------------------------------

const FNG_URL = "https://api.alternative.me/fng/?limit=0";
const ONE_HOUR = 60 * 60 * 1000;

async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await tracedFetch(FNG_URL);
  if (!res.ok) throw new Error(`Fear & Greed API returned ${res.status}`);
  const raw = (await res.json()) as FNGRawResponse;
  if (raw.metadata.error) throw new Error(`Fear & Greed API error: ${raw.metadata.error}`);

  const history = raw.data.map(parseEntry);
  const current = history[0];
  if (!current) throw new Error("No Fear & Greed data available");

  return { current, history };
}

export const getFearGreedIndex = cached(ONE_HOUR, fetchFearGreed);
