import type { QueryClient } from "@tanstack/react-query";
import {
  Classes,
  FocusStyleManager,
  NonIdealState,
  Button,
  OverlaysProvider,
} from "@blueprintjs/core";
import { Error as ErrorIcon } from "@blueprintjs/icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Provider, useAtom } from "jotai";
import { useEffect } from "react";
import { RouteTracker } from "../components/analytics/RouteTracker.tsx";
import { themeAtom } from "../atoms/index.ts";
import { getThemeFn } from "../lib/auth.functions.ts";
import { store as jotaiStore } from "../lib/jotai-store.ts";
import appCss from "../styles/app.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async () => {
    if (typeof window !== "undefined") return { theme: undefined as "light" | "dark" | undefined };
    try {
      const theme = await getThemeFn();
      return { theme };
    } catch {
      return { theme: "dark" as const };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CBBI Blueprint — TanStack Start" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: umamiScript(),
  }),
  component: RootComponent,
  errorComponent: RootErrorComponent,
});

function umamiScript(): Array<{ src: string; async: boolean; [key: string]: string | boolean }> {
  const url = import.meta.env.VITE_UMAMI_SCRIPT_URL;
  const id = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (!url || !id) return [];
  return [
    {
      src: url,
      async: true,
      "data-website-id": id,
      "data-auto-track": "false",
    },
  ];
}

function RootComponent() {
  const { queryClient, theme: ssrTheme } = Route.useRouteContext();
  const [atomTheme] = useAtom(themeAtom, { store: jotaiStore });

  const theme = typeof window === "undefined" ? (ssrTheme ?? "dark") : atomTheme;

  useEffect(() => {
    FocusStyleManager.onlyShowFocusOnTabs();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={jotaiStore}>
        <html lang="en">
          <head>
            <HeadContent />
          </head>
          <body className={theme === "dark" ? Classes.DARK : ""}>
            <OverlaysProvider>
              <Outlet />
            </OverlaysProvider>
            <RouteTracker />
            <Scripts />
          </body>
        </html>
      </Provider>
    </QueryClientProvider>
  );
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[RootError]", error);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error — CBBI Blueprint</title>
      </head>
      <body
        className={Classes.DARK}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <NonIdealState
          icon={<ErrorIcon />}
          title="Application error"
          description={error.message || "An unexpected error occurred."}
          action={<Button intent="primary" text="Try Again" onClick={reset} />}
        />
      </body>
    </html>
  );
}
