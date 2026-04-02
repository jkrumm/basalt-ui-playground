import { NonIdealState } from "@blueprintjs/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFound,
});

function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <NonIdealState
        icon="search"
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
      />
    </div>
  );
}
