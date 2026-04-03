import type { UserPreferences } from "@basalt-ui-playground/schemas";
import type { HistoryPoint } from "../../../components/CBBIChart.tsx";
import type { CBBIDashboardData } from "../../../queries/market.queries.ts";
import {
  Button,
  ButtonGroup,
  Callout,
  Card,
  Elevation,
  H2,
  H5,
  HTMLSelect,
  HTMLTable,
  Intent,
  ProgressBar,
  Spinner,
  Tag,
  Tooltip,
} from "@blueprintjs/core";
import { WarningSign as WarningSignIcon } from "@blueprintjs/icons";
import { Box, Flex } from "@blueprintjs/labs";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconFlame,
  IconInfoCircle,
  IconLayoutGrid,
  IconLayoutList,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { lazy, Suspense, useEffect, useState } from "react";
import { sortByAtom, viewModeAtom } from "../../../atoms/index.ts";
import { DefaultError } from "../../../components/DefaultError.tsx";
import { PageLayout } from "../../../components/layout/PageLayout.tsx";
import { EVENTS, track } from "../../../lib/analytics.ts";
import { store } from "../../../lib/jotai-store.ts";
import {
  bitcoinPriceQuery,
  cbbiDashboardQuery,
  fearGreedQuery,
} from "../../../queries/market.queries.ts";
import styles from "../../index.module.css";

const CBBIChart = lazy(() =>
  import("../../../components/CBBIChart.tsx").then((m) => ({ default: m.CBBIChart })),
);

// ---------------------------------------------------------------------------
// Route — ensureQueryData for critical CBBI, prefetchQuery for optional data
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_app/dashboard/")({
  loader: async ({ context: { queryClient } }) => {
    // All three must be awaited so their data lands in the SSR HTML.
    // If prefetchQuery data were streamed-only (fire-and-forget), the inline script
    // chunks would update the QueryClient BEFORE React hydrates, causing a mismatch
    // between the SSR HTML (DataUnavailable) and what React would render (component
    // with data) → React error #418.
    // prefetchQuery swallows errors so bitcoin/fear-greed failures don't throw.
    await Promise.all([
      queryClient.ensureQueryData(cbbiDashboardQuery()), // throws on failure → errorComponent
      queryClient.prefetchQuery(bitcoinPriceQuery()), // no-throw if unavailable
      queryClient.prefetchQuery(fearGreedQuery()), // no-throw if unavailable
    ]);
  },
  errorComponent: ({ error, reset }) => (
    <PageLayout>
      <Box style={{ padding: "40px 0" }}>
        <DefaultError error={error} reset={reset} />
      </Box>
    </PageLayout>
  ),
  component: CBBIDashboard,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getIntent(v: number): Intent {
  if (v < 0.33) return Intent.SUCCESS;
  if (v < 0.66) return Intent.WARNING;
  return Intent.DANGER;
}

function getZoneLabel(v: number): string {
  if (v < 0.2) return "Deep Accumulation";
  if (v < 0.4) return "Accumulation";
  if (v < 0.6) return "Neutral";
  if (v < 0.75) return "Caution";
  if (v < 0.9) return "Distribution";
  return "Market Top";
}

function fmtPct(v: number | null): string {
  return v !== null ? `${(v * 100).toFixed(1)}%` : "—";
}

function fmtPrice(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtChange(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function fmtVolume(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

function fearGreedIntent(value: number): Intent {
  if (value <= 25) return Intent.DANGER;
  if (value <= 45) return Intent.WARNING;
  if (value <= 55) return Intent.NONE;
  if (value <= 75) return Intent.PRIMARY;
  return Intent.SUCCESS;
}

function getCalloutConfig(confidence: number): {
  intent: Intent;
  icon: React.JSX.Element;
  title: string;
  message: string;
} {
  if (confidence < 0.2) {
    return {
      intent: Intent.SUCCESS,
      icon: <IconCircleCheck size={16} />,
      title: "Deep Accumulation Zone",
      message:
        "On-chain metrics are at historically low levels. Bitcoin has traded in this range during early cycle phases and post-crash recoveries. Risk/reward is historically favorable.",
    };
  }
  if (confidence < 0.4) {
    return {
      intent: Intent.SUCCESS,
      icon: <IconCircleCheck size={16} />,
      title: "Accumulation Zone",
      message:
        "Below the neutral midpoint. On-chain data reflects mid-cycle consolidation with no overheating signals. Historically a reasonable entry window before the next expansion phase.",
    };
  }
  if (confidence < 0.6) {
    return {
      intent: Intent.PRIMARY,
      icon: <IconInfoCircle size={16} />,
      title: "Neutral — Mid Cycle",
      message:
        "No strong directional signal. The market is transitioning between accumulation and distribution phases. On-chain data is balanced.",
    };
  }
  if (confidence < 0.75) {
    return {
      intent: Intent.WARNING,
      icon: <IconAlertTriangle size={16} />,
      title: "Caution — Cycle Heating Up",
      message:
        "Multiple indicators are elevating. Historically, this range precedes the later stages of a bull cycle. Consider managing position size.",
    };
  }
  if (confidence < 0.9) {
    return {
      intent: Intent.DANGER,
      icon: <IconFlame size={16} />,
      title: "Distribution Zone",
      message:
        "Strong on-chain sell signal across multiple metrics. Historical Bitcoin cycle tops have occurred in this range. Exercise caution with new exposure.",
    };
  }
  return {
    intent: Intent.DANGER,
    icon: <IconCircleX size={16} />,
    title: "Market Top Territory",
    message:
      "Extreme readings across all indicators. Every prior Bitcoin cycle top has occurred at CBBI levels above 0.9. Historical data suggests extreme caution.",
  };
}

interface Indicator {
  key: string;
  name: string;
  description: string;
  value: number | null;
  zone: string;
}

function getSortedIndicators(indicators: Indicator[], sortBy: string): Indicator[] {
  if (sortBy === "value-asc")
    return [...indicators].sort((a, b) => (a.value ?? -1) - (b.value ?? -1));
  if (sortBy === "value-desc")
    return [...indicators].sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  return indicators;
}

// ---------------------------------------------------------------------------
// Bitcoin Price Ticker — polls every 10 seconds
// ---------------------------------------------------------------------------

function DataUnavailable({ label }: { label: string }) {
  return (
    <Box marginBottom={4}>
      <Callout intent={Intent.WARNING} icon={<WarningSignIcon />}>
        {label} data is temporarily unavailable. It will retry automatically.
      </Callout>
    </Box>
  );
}

function BitcoinPriceTicker() {
  const { data: bitcoin } = useQuery({
    ...bitcoinPriceQuery(),
    refetchInterval: 60_000,
  });

  if (!bitcoin) return <DataUnavailable label="Bitcoin price" />;

  return (
    <Box marginBottom={4}>
      <Card elevation={Elevation.TWO}>
        <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Flex alignItems="baseline" gap={2}>
            <H2 style={{ margin: 0 }}>BTC ${fmtPrice(bitcoin.usd)}</H2>
            <Tag large intent={bitcoin.usd24hChange >= 0 ? Intent.SUCCESS : Intent.DANGER} minimal>
              {fmtChange(bitcoin.usd24hChange)} 24h
            </Tag>
          </Flex>
          <Flex gap={2} flexWrap="wrap">
            <Tag minimal>Vol: {fmtVolume(bitcoin.usd24hVolume)}</Tag>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Fear & Greed Widget
// ---------------------------------------------------------------------------

function FearGreedWidget() {
  const { data: fearGreed } = useQuery(fearGreedQuery());

  if (!fearGreed) return <DataUnavailable label="Fear & Greed" />;
  const { current } = fearGreed;

  return (
    <Box marginBottom={4}>
      <Card elevation={Elevation.ONE}>
        <Flex justifyContent="space-between" alignItems="center">
          <Flex alignItems="center" gap={2}>
            <H5 style={{ margin: 0 }}>Fear & Greed Index</H5>
            <Tag large intent={fearGreedIntent(current.value)}>
              {current.value} — {current.classification}
            </Tag>
          </Flex>
          <Tag minimal>{current.date}</Tag>
        </Flex>
        <Box marginTop={2}>
          <ProgressBar
            value={current.value / 100}
            intent={fearGreedIntent(current.value)}
            animate={false}
            stripes={false}
            style={{ height: 8 }}
          />
        </Box>
      </Card>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function CBBIDashboard() {
  const { data: cbbiData } = useQuery(cbbiDashboardQuery());

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Box className={styles.container}>
          {/* Bitcoin price ticker — polls every 10s */}
          <BitcoinPriceTicker />

          {/* Fear & Greed Index */}
          <FearGreedWidget />

          {/* CBBI section — ensureQueryData guarantees data after loader; DataUnavailable is a safety net */}
          {!cbbiData ? <DataUnavailable label="CBBI dashboard" /> : <CBBISection data={cbbiData} />}

          {/* Source */}
          <p className="cbbi-source">
            Data: <a href="https://colintalkscrypto.com/cbbi">colintalkscrypto.com/cbbi</a>
            {" · "}
            <a href="https://github.com/Zaczero/CBBI">CBBI algorithm</a>
            {" · "}
            <a href="https://www.binance.com/">Binance</a>
            {" · "}
            <a href="https://alternative.me/crypto/fear-and-greed-index/">Alternative.me</a>
          </p>
        </Box>
      </Box>
    </PageLayout>
  );
}

// ---------------------------------------------------------------------------
// CBBI Section — extracted for clean null-guard in parent
// ---------------------------------------------------------------------------

function CBBISection({ data: cbbiData }: { data: CBBIDashboardData }) {
  const [viewMode, setViewMode] = useAtom(viewModeAtom, { store });
  const [sortBy, setSortBy] = useAtom(sortByAtom, { store });
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const { price, confidence, indicators, history } = cbbiData;
  const callout = getCalloutConfig(confidence);
  const sortedIndicators = getSortedIndicators(indicators as Indicator[], sortBy);
  const chartData: HistoryPoint[] = history.map(
    (p: { timestamp: number; price: number; confidence: number }) => ({
      ts: p.timestamp,
      price: p.price,
      confidence: p.confidence,
    }),
  );

  return (
    <>
      {/* CBBI Confidence card */}
      <Box marginBottom={4}>
        <Card elevation={Elevation.TWO}>
          <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
            <H2 style={{ margin: 0 }}>CBBI Confidence</H2>
            <Flex gap={2} alignItems="center">
              <Tag large>BTC ${fmtPrice(price)}</Tag>
              <Tag large intent={getIntent(confidence)}>
                {getZoneLabel(confidence)}
              </Tag>
              <Tag large minimal>
                {fmtPct(confidence)}
              </Tag>
            </Flex>
          </Flex>
          <ProgressBar
            value={confidence}
            intent={getIntent(confidence)}
            animate={false}
            stripes={false}
            style={{ height: 12 }}
          />
          <p className="cbbi-meta" style={{ marginTop: 12 }}>
            Composite of 9 on-chain indicators. Low = accumulation zone &mdash; High = distribution
            / approaching cycle top.
          </p>
        </Card>
      </Box>

      {/* Callout */}
      <Box marginBottom={6}>
        <Callout intent={callout.intent} icon={callout.icon} title={callout.title}>
          {callout.message}
        </Callout>
      </Box>

      {/* Controls */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        marginBottom={4}
        gap={2}
        flexWrap="wrap"
      >
        <ButtonGroup>
          <Button
            icon={<IconLayoutGrid size={16} />}
            text="Grid"
            active={viewMode === "grid"}
            onClick={() => {
              setViewMode("grid");
              track(EVENTS.VIEW_TOGGLED, { component: "indicator-grid", view: "grid" });
            }}
          />
          <Button
            icon={<IconLayoutList size={16} />}
            text="Table"
            active={viewMode === "table"}
            onClick={() => {
              setViewMode("table");
              track(EVENTS.VIEW_TOGGLED, { component: "indicator-grid", view: "table" });
            }}
          />
        </ButtonGroup>

        <HTMLSelect
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as UserPreferences["sortBy"]);
            track(EVENTS.SELECT_CHANGED, {
              component: "indicator-grid",
              field: "sort",
              value: e.target.value,
            });
          }}
          options={[
            { label: "Default order", value: "default" },
            { label: "Value: Low → High", value: "value-asc" },
            { label: "Value: High → Low", value: "value-desc" },
          ]}
        />
      </Flex>

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className={styles.grid}>
          {sortedIndicators.map((ind) => (
            <Card key={ind.key} elevation={Elevation.ONE}>
              <Flex flexDirection="column" gap={2}>
                <Flex justifyContent="space-between" alignItems="start">
                  <Tooltip content={ind.description} placement="top" compact>
                    <H5 style={{ margin: 0, cursor: "help" }}>{ind.name}</H5>
                  </Tooltip>
                  <Tag minimal intent={ind.value !== null ? getIntent(ind.value) : Intent.NONE}>
                    {fmtPct(ind.value)}
                  </Tag>
                </Flex>
                <ProgressBar
                  value={ind.value ?? 0}
                  intent={ind.value !== null ? getIntent(ind.value) : Intent.NONE}
                  animate={false}
                  stripes={false}
                />
              </Flex>
            </Card>
          ))}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <Card elevation={Elevation.ONE} style={{ padding: 0, overflow: "hidden" }}>
          <HTMLTable striped interactive style={{ width: "100%", margin: 0 }}>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Value</th>
                <th>Zone</th>
                <th style={{ width: 140 }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedIndicators.map((ind) => (
                <tr key={ind.key}>
                  <td>
                    <strong>{ind.name}</strong>
                  </td>
                  <td className="cbbi-meta" style={{ maxWidth: 280 }}>
                    {ind.description}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Tag minimal intent={ind.value !== null ? getIntent(ind.value) : Intent.NONE}>
                      {fmtPct(ind.value)}
                    </Tag>
                  </td>
                  <td
                    style={{ color: "var(--bp-typography-color-default-disabled)", fontSize: 13 }}
                  >
                    {ind.value !== null ? getZoneLabel(ind.value) : "—"}
                  </td>
                  <td>
                    <ProgressBar
                      value={ind.value ?? 0}
                      intent={ind.value !== null ? getIntent(ind.value) : Intent.NONE}
                      animate={false}
                      stripes={false}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </Card>
      )}

      {/* Historical chart — client-only */}
      <Box marginTop={6} marginBottom={6}>
        <Card elevation={Elevation.TWO}>
          <H2 style={{ margin: "0 0 4px" }}>Historical Chart</H2>
          <Box marginBottom={4}>
            <p className="cbbi-meta">
              Weekly Bitcoin price (right axis, log scale) with CBBI confidence dots colored by
              cycle position.
            </p>
          </Box>
          {isMounted ? (
            <Suspense
              fallback={
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  className={styles.spinnerContainer}
                >
                  <Spinner size={40} />
                </Flex>
              }
            >
              <CBBIChart data={chartData} />
            </Suspense>
          ) : (
            <Flex alignItems="center" justifyContent="center" className={styles.spinnerContainer}>
              <Spinner size={40} />
            </Flex>
          )}
        </Card>
      </Box>
    </>
  );
}
