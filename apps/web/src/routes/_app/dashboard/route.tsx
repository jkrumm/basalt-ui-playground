import { Button } from "@blueprintjs/core";
import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardShell,
});

// Fixed CBBI indicator keys — these match the API keys exactly (used as URL params)
const INDICATOR_TABS = [
  { key: "PiCycle", label: "Pi Cycle" },
  { key: "RUPL", label: "RUPL" },
  { key: "RHODL", label: "RHODL" },
  { key: "Puell", label: "Puell" },
  { key: "2YMA", label: "2Y MA" },
  { key: "Trolololo", label: "Trolololo" },
  { key: "MVRV", label: "MVRV" },
  { key: "ReserveRisk", label: "Reserve Risk" },
  { key: "Woobull", label: "Woobull" },
] as const;

const tabStyle = (isActive: boolean) => ({
  borderRadius: 0,
  borderBottom: isActive ? "2px solid var(--bp-intent-primary-rest)" : "2px solid transparent",
});

function DashboardSubNav() {
  const matchRoute = useMatchRoute();
  // Match overview tab when exactly on /dashboard (fuzzy: false = exact path match)
  const isOverviewActive = !!matchRoute({ to: "/dashboard", fuzzy: false });

  return (
    <div
      style={{
        display: "flex",
        overflowX: "auto",
        padding: "0 16px",
        borderBottom: "1px solid var(--bp-divider-color)",
      }}
    >
      <Link to="/dashboard" style={{ textDecoration: "none" }}>
        <Button
          variant="minimal"
          text="Overview"
          active={isOverviewActive}
          style={tabStyle(isOverviewActive)}
        />
      </Link>

      {INDICATOR_TABS.map((tab) => {
        const isActive = !!matchRoute({
          to: "/dashboard/$key",
          params: { key: tab.key },
        });
        return (
          <Link
            key={tab.key}
            to="/dashboard/$key"
            params={{ key: tab.key }}
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="minimal"
              text={tab.label}
              active={isActive}
              style={tabStyle(isActive)}
            />
          </Link>
        );
      })}
    </div>
  );
}

function DashboardShell() {
  return (
    <div>
      <DashboardSubNav />
      <Outlet />
    </div>
  );
}
