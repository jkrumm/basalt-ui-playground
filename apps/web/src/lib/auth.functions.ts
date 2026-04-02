import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";

type SessionResponse = {
  session: { id: string; userId: string; expiresAt: string };
  user: { id: string; name: string; email: string; emailVerified: boolean };
};

// Resolves the BetterAuth session server-side by forwarding the session cookie.
// Used in protected route beforeLoad for SSR-safe auth checks.
// Trace propagation is handled automatically by the EdenTreaty client (api.ts headers())
// and tracedFetch — no manual propagation.inject() needed.
export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const cookie = getRequestHeader("cookie") ?? "";
  const apiUrl = process.env["API_INTERNAL_URL"] ?? "http://localhost:7713";
  const { tracedFetch } = await import("./traced-fetch.ts");

  const response = await tracedFetch(`${apiUrl}/api/auth/get-session`, {
    headers: { cookie },
  });
  if (!response.ok) return null;
  return response.json() as Promise<SessionResponse | null>;
});

// Reads the theme preference from cookie for SSR-correct dark/light rendering.
export const getThemeFn = createServerFn({ method: "GET" }).handler(async () => {
  const theme = getCookie("theme");
  if (theme === "light" || theme === "dark") return theme;
  return "dark" as const;
});
