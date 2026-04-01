import { Button, Card, Elevation, H1, H5, Tag, Intent } from "@blueprintjs/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card elevation={Elevation.TWO} style={{ maxWidth: 480, width: "100%" }}>
        <H1>CBBI Blueprint</H1>
        <H5 className="bp6-text-muted">TanStack Start + Elysia + Blueprint v6</H5>
        <p className="bp6-running-text mt-4">
          Frontend shell is running. Blueprint v6, Tailwind v4, Jotai, and TanStack Query are wired
          up and ready.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button intent={Intent.PRIMARY}>Get Started</Button>
          <Tag intent={Intent.SUCCESS} minimal>
            Stack Active
          </Tag>
        </div>
      </Card>
    </div>
  );
}
