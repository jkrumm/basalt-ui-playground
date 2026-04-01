import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 7712,
    proxy: {
      "/api": {
        target: "http://localhost:7713",
        changeOrigin: true,
      },
    },
  },
  ssr: {
    // Vite 8 SSR externalization incorrectly loads the CJS build of these
    // packages instead of ESM. Force bundling through Rolldown to use ESM.
    noExternal: ["@tanstack/router-core", "@tanstack/react-router"],
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    tailwindcss(),
    // React plugin for JSX transform — no babel option in @vitejs/plugin-react@6
    viteReact(),
    // React Compiler via separate babel pass (required for Rolldown/Vite 8)
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
