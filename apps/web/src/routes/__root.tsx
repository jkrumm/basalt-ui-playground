import { Classes } from "@blueprintjs/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Provider, useAtom } from "jotai";
import { RouteTracker } from "../components/analytics/RouteTracker.tsx";
import { ContentNav } from "../components/layout/ContentNav.tsx";
import { SearchModal } from "../components/content/SearchModal.tsx";
import { searchOpenAtom, themeAtom } from "../atoms/index.ts";
import { getThemeFn } from "../lib/auth.functions.ts";
import { initHyperDX } from "../lib/hyperdx.ts";
import { store as jotaiStore } from "../lib/jotai-store.ts";
import { queryClient } from "../lib/query-client.ts";
import appCss from "../styles/app.css?url";

if (typeof window !== "undefined") {
  initHyperDX();
}

export const Route = createRootRoute({
  beforeLoad: async () => {
    if (typeof window !== "undefined") return { theme: undefined as "light" | "dark" | undefined };
    const theme = await getThemeFn();
    return { theme };
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

function SearchModalWrapper() {
  const [isOpen, setIsOpen] = useAtom(searchOpenAtom, { store: jotaiStore });
  return <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}

function RootComponent() {
  const { theme: ssrTheme } = Route.useRouteContext();
  const [atomTheme] = useAtom(themeAtom, { store: jotaiStore });

  const theme = typeof window === "undefined" ? (ssrTheme ?? "dark") : atomTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={jotaiStore}>
        <html lang="en">
          <head>
            <HeadContent />
          </head>
          <body className={theme === "dark" ? Classes.DARK : ""}>
            <ContentNav />
            <Outlet />
            <SearchModalWrapper />
            <RouteTracker />
            <Scripts />
          </body>
        </html>
      </Provider>
    </QueryClientProvider>
  );
}
