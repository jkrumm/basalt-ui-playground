import type { SitemapEntry } from "./content";

const BASE_URL = "https://cbbi.jkrumm.com";

const STATIC_ROUTES: SitemapEntry[] = [
  { url: "/" },
  { url: "/blog" },
  { url: "/docs" },
  { url: "/guides" },
  { url: "/blocks" },
];

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(({ url, lastmod }) => {
      const loc = `${BASE_URL}${url}`;
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function collectSitemapEntries(...entryGroups: SitemapEntry[][]): SitemapEntry[] {
  return [...STATIC_ROUTES, ...entryGroups.flat()];
}

export function buildLlmsTxt(): string {
  return `# CBBI Blueprint

> Bitcoin Cycle Bull Index (CBBI) dashboard and developer knowledge base.
> Built with Blueprint component library, TanStack Start, React, and MDX.

## Key Pages

- [Dashboard](${BASE_URL}/) — Live CBBI score with full indicator breakdown and historical chart
- [Blog](${BASE_URL}/blog) — Technical articles on React, TanStack, Blueprint, and Bitcoin analytics
- [Docs](${BASE_URL}/docs) — Developer documentation for Blueprint and the content system
- [Guides](${BASE_URL}/guides) — Step-by-step implementation guides
- [Blocks](${BASE_URL}/blocks) — Reusable UI component examples and patterns

## Optional

- [Sitemap](${BASE_URL}/sitemap.xml)
`;
}
