import mdx from "@mdx-js/rollup";
import babel from "@rolldown/plugin-babel";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import viteReact from "@vitejs/plugin-react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import contentCollections from "@content-collections/vite";
import { defineConfig } from "vite";
import { blueprintDarkTheme } from "./src/lib/mdx-theme.ts";
import rehypeShiki from "@shikijs/rehype";
import {
  transformerNotationHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationErrorLevel,
  transformerMetaHighlight,
} from "@shikijs/transformers";

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
    // 1. content-collections — generates allPosts / allDocs / allGuides / allBlocks
    //    (frontmatter validation, slug, readingTime, headings) before Vite processes MDX.
    contentCollections(),
    // 2. MDX — compiles MDX files to React components (ES modules).
    //    Frontmatter and headings are now owned by content-collections, so only
    //    remark-gfm and the rehype rendering plugins remain here.
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: { className: ["heading-anchor"], ariaLabel: "Link to section" },
            },
          ],
          [
            rehypeShiki,
            {
              theme: blueprintDarkTheme,
              transformers: [
                transformerNotationHighlight(),
                transformerNotationDiff(),
                transformerNotationFocus(),
                transformerNotationErrorLevel(),
                transformerMetaHighlight(),
              ],
              parseMetaString(meta: string) {
                const match = /filename="([^"]+)"/.exec(meta);
                if (match?.[1]) return { "data-filename": match[1] };
              },
            },
          ],
        ],
      }),
    },
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
    // 3. React plugin must declare MDX as JSX-containing for HMR
    viteReact({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    // 4. React Compiler processes MDX-compiled output the same as .tsx
    babel({ presets: [reactCompilerPreset()] }),
    // 5. llms.txt dev middleware — serves /llms.txt in development
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
    // 6. Sitemap dev middleware — serves /sitemap.xml in development
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
