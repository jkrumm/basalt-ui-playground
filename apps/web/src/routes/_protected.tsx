import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSessionFn } from "~/lib/auth.functions.ts";
import { identifyUser } from "~/lib/hyperdx.ts";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    try {
      const session = await getSessionFn();
      if (!session) {
        throw redirect({ to: "/sign-in", search: { redirect: location.href } });
      }
      return { user: session.user };
    } catch (e) {
      if (isRedirect(e)) throw e;
      // Session fetch failed (network error, server down) — redirect to sign-in
      throw redirect({ to: "/sign-in", search: { redirect: location.href } });
    }
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
