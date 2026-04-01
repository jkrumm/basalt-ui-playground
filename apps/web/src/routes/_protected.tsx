import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSessionFn } from "~/lib/auth.functions.ts";
import { identifyUser } from "~/lib/hyperdx.ts";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn();
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
    return { user: session.user };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user } = Route.useRouteContext();
  useEffect(() => {
    identifyUser(user);
  }, [user.id]);
  return <Outlet />;
}
