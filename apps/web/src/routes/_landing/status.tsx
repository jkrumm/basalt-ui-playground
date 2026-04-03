import { Card, Elevation, H2, H5, Intent, Spinner, Tag } from "@blueprintjs/core";
import { Flex } from "@blueprintjs/labs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageLayout } from "../../components/layout/PageLayout.tsx";
import {
  bitcoinPriceQuery,
  cbbiDashboardQuery,
  fearGreedQuery,
} from "../../queries/market.queries.ts";

export const Route = createFileRoute("/_landing/status")({
  component: StatusPage,
});

// ---------------------------------------------------------------------------
// Status card
// ---------------------------------------------------------------------------

type ServiceStatus = "loading" | "ok" | "error";

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === "loading") {
    return (
      <Tag large minimal>
        <Spinner size={12} />
      </Tag>
    );
  }
  return (
    <Tag large intent={status === "ok" ? Intent.SUCCESS : Intent.DANGER}>
      {status === "ok" ? "Operational" : "Unavailable"}
    </Tag>
  );
}

function StatusCard({
  label,
  description,
  status,
}: {
  label: string;
  description: string;
  status: ServiceStatus;
}) {
  return (
    <Card elevation={Elevation.ONE} style={{ padding: "16px 20px" }}>
      <Flex justifyContent="space-between" alignItems="center">
        <div>
          <H5 style={{ margin: 0 }}>{label}</H5>
          <p
            style={{
              color: "var(--bp-typography-color-default-disabled)",
              margin: "4px 0 0",
              fontSize: 13,
            }}
          >
            {description}
          </p>
        </div>
        <StatusBadge status={status} />
      </Flex>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function queryToStatus(status: string): ServiceStatus {
  if (status === "success") return "ok";
  if (status === "error") return "error";
  return "loading";
}

function StatusPage() {
  const [apiStatus, setApiStatus] = useState<ServiceStatus>("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/health", { signal: controller.signal })
      .then((r) => setApiStatus(r.ok ? "ok" : "error"))
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== "AbortError") setApiStatus("error");
      });
    return () => controller.abort();
  }, []);

  const { status: cbbiStatus } = useQuery({ ...cbbiDashboardQuery(), retry: 0 });
  const { status: btcStatus } = useQuery({ ...bitcoinPriceQuery(), retry: 0 });
  const { status: fngStatus } = useQuery({ ...fearGreedQuery(), retry: 0 });

  return (
    <PageLayout>
      <div style={{ padding: "4rem 2rem", maxWidth: 640, margin: "0 auto" }}>
        <H2>System Status</H2>
        <p
          style={{
            color: "var(--bp-typography-color-default-disabled)",
            marginBottom: "2rem",
          }}
        >
          Real-time health of the API server and all external data sources.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <StatusCard
            label="API Server"
            description="Core application API — Elysia on Bun"
            status={apiStatus}
          />
          <StatusCard
            label="CBBI Data"
            description="Bitcoin Bull Run Index · colintalkscrypto.com (daily, cached 1h)"
            status={queryToStatus(cbbiStatus)}
          />
          <StatusCard
            label="Bitcoin Price"
            description="Live price feed · CoinGecko (cached 30s)"
            status={queryToStatus(btcStatus)}
          />
          <StatusCard
            label="Fear & Greed Index"
            description="Market sentiment · Alternative.me (daily, cached 1h)"
            status={queryToStatus(fngStatus)}
          />
        </div>
      </div>
    </PageLayout>
  );
}
