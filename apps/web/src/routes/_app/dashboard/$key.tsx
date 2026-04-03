import { Card, Elevation, H2, H5, Intent, ProgressBar, Tag } from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { DefaultError } from "../../../components/DefaultError.tsx";
import type { IndicatorHistoryPoint } from "../../../components/IndicatorChart.tsx";
import { PageLayout } from "../../../components/layout/PageLayout.tsx";
import { cbbiIndicatorDetailQuery } from "../../../queries/market.queries.ts";
import styles from "../../index.module.css";

const IndicatorChart = lazy(() =>
  import("../../../components/IndicatorChart.tsx").then((m) => ({ default: m.IndicatorChart })),
);

export const Route = createFileRoute("/_app/dashboard/$key")({
  loader: async ({ context: { queryClient }, params: { key } }) => {
    await queryClient.ensureQueryData(cbbiIndicatorDetailQuery(key));
  },
  errorComponent: ({ error, reset }) => (
    <PageLayout>
      <Box style={{ padding: "40px 20px" }}>
        <DefaultError error={error} reset={reset} />
      </Box>
    </PageLayout>
  ),
  component: IndicatorDetailPage,
});

// ---------------------------------------------------------------------------
// Helpers (duplicated from dashboard/index.tsx — intentionally not shared)
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

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, intent }: { label: string; value: string; intent?: Intent }) {
  return (
    <Card elevation={Elevation.ONE} style={{ flex: 1, textAlign: "center", padding: "16px 12px" }}>
      <div
        style={{
          color: "var(--bp-typography-color-default-disabled)",
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <Tag large minimal intent={intent}>
        {value}
      </Tag>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function IndicatorDetailPage() {
  const { key } = Route.useParams();
  const { data } = useQuery(cbbiIndicatorDetailQuery(key));
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!data) return null;

  const { name, description, value, stats, history } = data;

  const chartData: IndicatorHistoryPoint[] = history.map(
    (h: { timestamp: number; price: number; value: number | null }) => ({
      timestamp: h.timestamp,
      price: h.price,
      value: h.value,
    }),
  );

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Box className={styles.container}>
          {/* Header */}
          <Box marginBottom={5}>
            <Flex
              justifyContent="space-between"
              alignItems="start"
              marginBottom={3}
              flexWrap="wrap"
              gap={2}
            >
              <H2 style={{ margin: 0 }}>{name}</H2>
              <Flex gap={2} alignItems="center">
                {value !== null ? (
                  <>
                    <Tag large intent={getIntent(value)}>
                      {getZoneLabel(value)}
                    </Tag>
                    <Tag large minimal>
                      {fmtPct(value)}
                    </Tag>
                  </>
                ) : (
                  <Tag large minimal intent={Intent.NONE}>
                    Unavailable
                  </Tag>
                )}
              </Flex>
            </Flex>
            {value !== null && (
              <ProgressBar
                value={value}
                intent={getIntent(value)}
                animate={false}
                stripes={false}
                style={{ height: 8 }}
              />
            )}
          </Box>

          {/* Description */}
          <Box marginBottom={5}>
            <Card elevation={Elevation.ONE}>
              <p style={{ margin: 0, color: "var(--bp-typography-color-default-disabled)" }}>
                {description}
              </p>
            </Card>
          </Box>

          {/* Stats row */}
          <Flex gap={3} marginBottom={6} flexWrap="wrap">
            <StatCard
              label="Current"
              value={fmtPct(value)}
              intent={value !== null ? getIntent(value) : Intent.NONE}
            />
            <StatCard label="All-time min" value={fmtPct(stats.min)} />
            <StatCard label="All-time max" value={fmtPct(stats.max)} />
            <StatCard label="Average" value={fmtPct(stats.avg)} />
          </Flex>

          {/* Historical chart */}
          <Card elevation={Elevation.TWO}>
            <H5 style={{ margin: "0 0 4px" }}>Historical Chart</H5>
            <p
              style={{
                color: "var(--bp-typography-color-default-disabled)",
                margin: "0 0 16px",
                fontSize: 13,
              }}
            >
              Weekly {name} value (left axis, 0–100%) with Bitcoin price (right axis, log scale).
            </p>
            {isMounted ? (
              <Suspense fallback={<div style={{ height: 360 }} />}>
                <IndicatorChart data={chartData} />
              </Suspense>
            ) : (
              <div style={{ height: 360 }} />
            )}
          </Card>
        </Box>
      </Box>
    </PageLayout>
  );
}
