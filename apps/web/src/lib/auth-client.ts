import { createAuthClient } from "better-auth/react";

// No baseURL — same-origin via Vite proxy in dev, reverse proxy in prod.
// For server-side session resolution, use getSessionFn (auth.functions.ts) instead.
export const authClient = createAuthClient();
