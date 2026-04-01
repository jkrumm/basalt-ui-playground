import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function createRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });
}

// TanStack Start v1.167+ requires `getRouter` export (not `createRouter`).
// The plugin resolves `#tanstack-router-entry` to this file and calls `getRouter()`
// from `hydrateStart()`. A new instance per call is correct — SSR creates fresh
// routers per request; the client singleton is managed by StartClient internally.
export function getRouter() {
  return createRouter();
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
