import { H2, Spinner } from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import type { HistoryPoint } from "../../components/CBBIChart.tsx";
import { DefaultError } from "../../components/DefaultError.tsx";
import { PageLayout } from "../../components/layout/PageLayout.tsx";
import { cbbiDashboardQuery } from "../../queries/market.queries.ts";

const CBBIChart = lazy(() =>
  import("../../components/CBBIChart.tsx").then((m) => ({ default: m.CBBIChart })),
);

export const Route = createFileRoute("/_app/chart")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(cbbiDashboardQuery());
  },
  errorComponent: ({ error, reset }) => (
    <PageLayout>
      <Box style={{ padding: "40px 24px" }}>
        <DefaultError error={error} reset={reset} />
      </Box>
    </PageLayout>
  ),
  component: ChartPage,
});

function ChartPage() {
  const { data } = useQuery(cbbiDashboardQuery());
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const chartData: HistoryPoint[] = (data?.history ?? []).map(
    (p: { timestamp: number; price: number; confidence: number }) => ({
      ts: p.timestamp,
      price: p.price,
      confidence: p.confidence,
    }),
  );

  return (
    <PageLayout>
      <Box style={{ padding: "24px" }}>
        <Flex
          justifyContent="space-between"
          alignItems="baseline"
          marginBottom={4}
          flexWrap="wrap"
          gap={2}
        >
          <H2 style={{ margin: 0 }}>CBBI Historical Chart</H2>
          <span style={{ fontSize: 13, color: "var(--bp-typography-color-default-disabled)" }}>
            Weekly Bitcoin price with CBBI confidence · full cycle history
          </span>
        </Flex>

        {isMounted ? (
          <Suspense
            fallback={
              <Flex alignItems="center" justifyContent="center" style={{ height: 480 }}>
                <Spinner size={40} />
              </Flex>
            }
          >
            <CBBIChart data={chartData} />
          </Suspense>
        ) : (
          <Flex alignItems="center" justifyContent="center" style={{ height: 480 }}>
            <Spinner size={40} />
          </Flex>
        )}
      </Box>
    </PageLayout>
  );
}
