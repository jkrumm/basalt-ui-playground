/**
 * CBBI (Colin Talks Crypto Bitcoin Bull Run Index) adapter.
 *
 * Fetches the latest composite index from colintalkscrypto.com and transforms
 * the raw time-series data into typed domain objects for the dashboard and table views.
 *
 * @see https://colintalkscrypto.com/cbbi/
 */

import { cached, tracedFetch } from "../lib/traced-fetch.ts";

// ---------------------------------------------------------------------------
// External API types
// ---------------------------------------------------------------------------

type IndicatorKey =
  | "PiCycle"
  | "RUPL"
  | "RHODL"
  | "Puell"
  | "2YMA"
  | "Trolololo"
  | "MVRV"
  | "ReserveRisk"
  | "Woobull";

type CBBIRaw = {
  Price: Record<string, number>;
  Confidence: Record<string, number>;
} & Record<IndicatorKey, Record<string, number | null>>;

// ---------------------------------------------------------------------------
// Domain types (returned by API routes)
// ---------------------------------------------------------------------------

export interface CBBIIndicator {
  key: string;
  name: string;
  description: string;
  value: number | null;
  zone: string;
}

export interface CBBIHistoryPoint {
  timestamp: number;
  price: number;
  confidence: number;
}

export interface CBBIDashboard {
  date: string;
  price: number;
  confidence: number;
  indicators: CBBIIndicator[];
  history: CBBIHistoryPoint[];
}

// ---------------------------------------------------------------------------
// Indicator metadata
// ---------------------------------------------------------------------------

const INDICATOR_META: Record<IndicatorKey, { name: string; description: string }> = {
  PiCycle: {
    name: "Pi Cycle Top",
    description: "Detects cycle tops via 111d / 350d moving-average crossover",
  },
  RUPL: {
    name: "RUPL",
    description: "Relative Unrealized Profit/Loss — overall market sentiment",
  },
  RHODL: {
    name: "RHODL Ratio",
    description: "Wealth distribution between short-term and long-term holders",
  },
  Puell: {
    name: "Puell Multiple",
    description: "Daily miner revenue vs 365-day average — miner profitability cycle",
  },
  "2YMA": {
    name: "2Y MA Multiplier",
    description: "Bitcoin price relative to its 2-year moving average",
  },
  Trolololo: {
    name: "Trolololo",
    description: "Bitcoin Rainbow Chart — logarithmic regression of long-run price",
  },
  MVRV: {
    name: "MVRV Z-Score",
    description: "Market cap vs Realized cap — detects statistical over/undervaluation",
  },
  ReserveRisk: {
    name: "Reserve Risk",
    description: "Long-term holder conviction relative to current price level",
  },
  Woobull: {
    name: "Woobull Top Cap",
    description: "Bitcoin price relative to Willy Woo's Top Cap model",
  },
};

const INDICATOR_KEYS = Object.keys(INDICATOR_META) as IndicatorKey[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zoneOf(v: number | null): string {
  if (v === null) return "Unknown";
  if (v < 0.2) return "Deep Accumulation";
  if (v < 0.4) return "Accumulation";
  if (v < 0.6) return "Neutral";
  if (v < 0.75) return "Caution";
  if (v < 0.9) return "Distribution";
  return "Market Top";
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Fetcher (cached — CBBI data updates daily)
// ---------------------------------------------------------------------------

const CBBI_URL = "https://colintalkscrypto.com/cbbi/data/latest.json";
const ONE_HOUR = 60 * 60 * 1000;

async function fetchRaw(): Promise<CBBIRaw> {
  const res = await tracedFetch(CBBI_URL);
  if (!res.ok) throw new Error(`CBBI API returned ${res.status}`);
  return res.json() as Promise<CBBIRaw>;
}

const getCachedRaw = cached(ONE_HOUR, fetchRaw);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCBBIDashboard(): Promise<CBBIDashboard> {
  const raw = await getCachedRaw();
  const timestamps = Object.keys(raw.Price).toSorted();
  const latest = timestamps.at(-1);
  if (!latest) throw new Error("No timestamps in CBBI data");

  const indicators: CBBIIndicator[] = INDICATOR_KEYS.map((key) => {
    const meta = INDICATOR_META[key];
    const value = raw[key]?.[latest] ?? null;
    return { key, name: meta.name, description: meta.description, value, zone: zoneOf(value) };
  });

  const history: CBBIHistoryPoint[] = timestamps
    .filter((_, i) => i % 7 === 0)
    .flatMap((t) => {
      const price = raw.Price[t];
      const conf = raw.Confidence[t];
      if (price == null || conf == null) return [];
      return [{ timestamp: Number.parseInt(t), price, confidence: Math.round(conf * 1000) / 10 }];
    });

  return {
    date: formatDate(Number.parseInt(latest)),
    price: raw.Price[latest]!,
    confidence: raw.Confidence[latest]!,
    indicators,
    history,
  };
}

export async function getCBBIIndicators(): Promise<CBBIIndicator[]> {
  const dashboard = await getCBBIDashboard();
  return dashboard.indicators;
}
