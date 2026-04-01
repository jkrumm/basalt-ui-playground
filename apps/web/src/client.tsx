/// <reference types="vite/client" />
import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

// TanStack Start v1.167+: StartClient resolves the router via virtual module
// `#tanstack-router-entry` (mapped to router.tsx) — no prop needed.
hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);
