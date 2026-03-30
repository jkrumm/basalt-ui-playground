import { createAuthClient } from "better-auth/react";

// No baseURL — same origin via Vite proxy in dev, Node server in prod.
export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;
