import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_content/blog")({
  component: () => <Outlet />,
});
