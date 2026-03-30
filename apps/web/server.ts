import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { app as apiApp } from "@cbbi/api";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { etag } from "hono/etag";
import { buildSitemapXml, buildLlmsTxt, collectSitemapEntries } from "./src/lib/sitemap";
import {
  getBlogSitemapEntries,
  getDocsSitemapEntries,
  getGuidesSitemapEntries,
  getBlocksSitemapEntries,
} from "./src/lib/content";

const PORT = Number(process.env.PORT ?? 3000);
const SERVER_ENTRY = "./dist/server/server.js";

// Load TanStack Start SSR handler
const serverModule = (await import(SERVER_ENTRY)) as {
  default: { fetch: (req: Request) => Response | Promise<Response> };
};
const ssrHandler = serverModule.default;

const app = new Hono();

app.use(compress());
app.use(etag());

// Sitemap + LLMs
app.get("/sitemap.xml", (c) => {
  const xml = buildSitemapXml(
    collectSitemapEntries(
      getBlogSitemapEntries(),
      getDocsSitemapEntries(),
      getGuidesSitemapEntries(),
      getBlocksSitemapEntries(),
    ),
  );
  return c.body(xml, 200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});

app.get("/llms.txt", (c) =>
  c.body(buildLlmsTxt(), 200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  }),
);

// API routes
app.route("/", apiApp);

// Immutable cache headers for hashed assets
app.use("/assets/*", async (c, next) => {
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  await next();
});

// Static files from dist/client
app.use("/*", serveStatic({ root: "./dist/client" }));

// SSR fallback
app.all("/*", (c) => ssrHandler.fetch(c.req.raw));

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[INFO] Server listening on http://localhost:${String(PORT)}`);
});
