import { Button, Intent } from "@blueprintjs/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Link, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import { Provider, useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { searchOpenAtom, themeAtom } from "../atoms/index.ts";
import { SearchModal } from "../components/content/SearchModal.tsx";
import { authClient } from "../lib/auth-client.ts";
import { getThemeFn } from "../lib/auth.functions.ts";
import { store as jotaiStore } from "../lib/jotai-store.ts";
import { queryClient } from "../lib/query-client.ts";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  beforeLoad: async () => {
    // Skip server function call on client — atom reads cookie directly.
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
  }),
  component: RootComponent,
});

function NavBar() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [theme, setTheme] = useAtom(themeAtom, { store: jotaiStore });
  const setSearchOpen = useSetAtom(searchOpenAtom, { store: jotaiStore });

  const handleSignOut = async () => {
    await authClient.signOut();
    await router.navigate({ to: "/" });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-1">
        <Link to="/" className="font-semibold">
          CBBI
        </Link>
        <Link to="/docs"><Button minimal small text="Docs" /></Link>
        <Link to="/blog" search={{ tag: "" }}><Button minimal small text="Blog" /></Link>
        <Link to="/guides" search={{ category: "", difficulty: "" }}><Button minimal small text="Guides" /></Link>
        <Link to="/blocks" search={{ category: "" }}><Button minimal small text="Blocks" /></Link>
      </div>
      <div className="flex items-center gap-2">
        <Button minimal small onClick={() => setSearchOpen(true)}>Search</Button>
        <Button minimal small onClick={toggleTheme}>
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
        {!isPending && session ? (
          <>
            <Link to="/settings">
              <Button minimal small>
                {session.user.name}
              </Button>
            </Link>
            <Button minimal small intent={Intent.DANGER} onClick={handleSignOut}>
              Sign Out
            </Button>
          </>
        ) : !isPending ? (
          <Link to="/sign-in">
            <Button minimal small intent={Intent.PRIMARY}>
              Sign In
            </Button>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

function SearchModalWrapper() {
  const [isOpen, setIsOpen] = useAtom(searchOpenAtom, { store: jotaiStore });

  // Listen for open-search event dispatched by DocsSidebar
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-search", handler);
    return () => window.removeEventListener("open-search", handler);
  }, [setIsOpen]);

  return <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}

function RootComponent() {
  const { theme: ssrTheme } = Route.useRouteContext();
  const [atomTheme] = useAtom(themeAtom, { store: jotaiStore });

  // Server: use cookie value from beforeLoad. Client: atom reads cookie directly.
  const theme = typeof window === "undefined" ? (ssrTheme ?? "dark") : atomTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={jotaiStore}>
        <html lang="en">
          <head>
            <HeadContent />
          </head>
          <body className={theme === "dark" ? "bp6-dark" : ""}>
            <NavBar />
            <Outlet />
            <SearchModalWrapper />
            <Scripts />
          </body>
        </html>
      </Provider>
    </QueryClientProvider>
  );
}
