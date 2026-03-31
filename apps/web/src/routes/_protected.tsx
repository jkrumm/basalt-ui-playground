import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionFn } from "../lib/auth.functions";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn();
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
    return {
      user: session.user,
      // Serialize as ISO string — Date objects don't survive router hydration reliably
      sessionExpiresAt: session.session.expiresAt.toISOString(),
    };
  },
  component: () => <Outlet />,
});
