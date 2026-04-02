import {
  dehydrate as dehydrateQueryClient,
  hydrate as hydrateQueryClient,
} from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { DefaultError } from "./components/DefaultError.tsx";
import { DefaultPending } from "./components/DefaultPending.tsx";
import { createQueryClient } from "./lib/query-client.ts";
import { routeTree } from "./routeTree.gen";

function createRouter() {
  const queryClient = createQueryClient();

  // Manual dehydration/hydration avoids the routerWithQueryClient@1.130.17 / Router 1.168.10
  // version mismatch. routerWithQueryClient used router.serverSsr.isDehydrated() (removed in
  // 1.168.x) for its streaming mechanism, causing pending queries to never hydrate on the client.
  // Since all queries are awaited in route loaders, synchronous dehydration is sufficient.
  return createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultError,
    defaultPendingComponent: DefaultPending,
    defaultPendingMs: 200,
    // Type assertion required: @tanstack/react-query types keys as readonly unknown[] but
    // TanStack Start expects readonly {}[] — version mismatch, runtime types are compatible.
    dehydrate: () =>
      dehydrateQueryClient(queryClient) as unknown as { [key: string]: NonNullable<unknown> },
    hydrate: (dehydrated) =>
      hydrateQueryClient(
        queryClient,
        dehydrated as unknown as ReturnType<typeof dehydrateQueryClient>,
      ),
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
