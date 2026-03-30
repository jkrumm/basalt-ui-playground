import type { AppType } from "@cbbi/api";
import { hc } from "hono/client";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

// createIsomorphicFn is TanStack Start's mechanism for server/client split logic.
// Server branch: in-process Hono call with zero HTTP overhead. Incoming request headers
//   (including the auth cookie) are captured and forwarded so Better Auth can authenticate.
// Client branch: HTTP via relative URL — Vite proxy in dev, same-origin Node server in prod.
// Dynamic import keeps @cbbi/api (and all of Hono) out of the client bundle.
export const getApi = createIsomorphicFn()
  .server(async () => {
    const { app } = await import("@cbbi/api");
    const reqHeaders = getRequestHeaders();
    return hc<AppType>("http://localhost", {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        // Merge incoming request headers with any headers set by the hono client.
        // Caller-set headers (e.g. Content-Type from $patch) take precedence.
        const merged = new Headers(reqHeaders);
        new Headers(init?.headers).forEach((v, k) => merged.set(k, v));
        return app.fetch(new Request(input as string, { ...init, headers: merged }));
      },
    });
  })
  .client(() =>
    hc<AppType>(import.meta.env.VITE_API_URL ?? "", {
      init: { credentials: "include" },
    }),
  );
