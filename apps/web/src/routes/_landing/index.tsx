import { Button, H1 } from "@blueprintjs/core";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_landing/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div style={{ padding: "4rem 2rem", maxWidth: 640, margin: "0 auto" }}>
      <H1>Welcome to BasaltUI Playground</H1>
      <p style={{ color: "var(--bp-typography-color-default-disabled)", marginBottom: "2rem" }}>
        A greenfield boilerplate aligning TanStack Start, Blueprint v6, Jotai, and TanStack Query
        patterns so downstream apps start from a well-considered baseline.
      </p>
      <Link to="/dashboard" style={{ textDecoration: "none" }}>
        <Button intent="primary" text="Go to Dashboard" large />
      </Link>
    </div>
  );
}
