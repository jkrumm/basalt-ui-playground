import babel from "@rolldown/plugin-babel";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import contentCollections from "@content-collections/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  ssr: {
    // Vite 8 SSR externalization incorrectly loads the CJS build of these
    // packages instead of ESM, causing "does not provide an export named"
    // errors. Force bundling through Rolldown to use the ESM build.
    noExternal: ["@tanstack/router-core", "@tanstack/react-router"],
  },
  plugins: [
    // 1. content-collections — generates allPosts / allDocs / allGuides / allBlocks.
    //    Handles the full MDX pipeline: frontmatter validation, compileMDX (mdx-bundler),
    //    Shiki code highlighting, heading extraction, reading time.
    contentCollections(),
    tsConfigPaths(),
    tanstackStart({
      // Content pages suitable for SSG prerendering.
      // The landing page (/) fetches live CBBI data — must stay SSR.
      // /table and other dynamic routes are not content pages.
      prerender: {
        enabled: true,
        crawlLinks: true,
        filter: ({ path }) =>
          path.startsWith("/blog") ||
          path.startsWith("/docs") ||
          path.startsWith("/guides") ||
          path.startsWith("/blocks") ||
          path === "/search",
      },
    }),
    // 2. React plugin for JSX transform (no babel option in @vitejs/plugin-react@6 / Rolldown era)
    viteReact(),
    // 3. React Compiler via @rolldown/plugin-babel — separate pass required for Rolldown/Vite 8
    babel({ presets: [reactCompilerPreset()] }),
    // 4. llms.txt dev middleware — serves /llms.txt in development
    {
      name: "llms-txt-dev",
      configureServer(server) {
        server.middlewares.use("/llms.txt", async (_req, res) => {
          try {
            const sitemap = await server.ssrLoadModule("/src/lib/sitemap.ts");
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end((sitemap.buildLlmsTxt as () => string)());
          } catch (e) {
            res.statusCode = 500;
            res.end(`llms.txt generation failed: ${String(e)}`);
          }
        });
      },
    },
    // 5. Sitemap dev middleware — serves /sitemap.xml in development
    {
      name: "sitemap-dev",
      configureServer(server) {
        server.middlewares.use("/sitemap.xml", async (_req, res) => {
          try {
            const content = await server.ssrLoadModule("/src/lib/content.ts");
            const sitemap = await server.ssrLoadModule("/src/lib/sitemap.ts");
            const xml = sitemap.buildSitemapXml(
              sitemap.collectSitemapEntries(
                content.getBlogSitemapEntries(),
                content.getDocsSitemapEntries(),
                content.getGuidesSitemapEntries(),
                content.getBlocksSitemapEntries(),
              ),
            ) as string;
            res.setHeader("Content-Type", "application/xml; charset=utf-8");
            res.end(xml);
          } catch (e) {
            res.statusCode = 500;
            res.end(`Sitemap generation failed: ${String(e)}`);
          }
        });
      },
    },
  ],
});
