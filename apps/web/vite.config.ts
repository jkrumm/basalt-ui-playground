import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import contentCollections from "@content-collections/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 7712,
    proxy: {
      "/api": {
        target: "http://localhost:7713",
        changeOrigin: true,
      },
      // Proxy OTLP ingest so browser SDK stays same-origin (avoids CORS to :4318)
      "/v1/traces": {
        target: "http://localhost:4318",
        changeOrigin: true,
      },
      "/v1/logs": {
        target: "http://localhost:4318",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    // Vite 8 native tsconfig paths — replaces vite-tsconfig-paths plugin
    tsconfigPaths: true,
  },
  ssr: {
    // Vite 8 SSR externalization incorrectly loads the CJS build of these
    // packages instead of ESM. Force bundling through Rolldown to use ESM.
    noExternal: ["@tanstack/router-core", "@tanstack/react-router"],
  },
  plugins: [
    tanstackStart(),
    tailwindcss(),
    contentCollections(),
    // React plugin for JSX transform — no babel option in @vitejs/plugin-react@6
    viteReact(),
    // React Compiler via separate babel pass (required for Rolldown/Vite 8)
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
