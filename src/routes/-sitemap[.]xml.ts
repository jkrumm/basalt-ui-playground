// Sitemap — served by the Vite dev middleware configured in vite.config.ts.
// In production, add to server.ts routes before the '/*' fallback.
//
// Example for server.ts:
//   import { buildSitemapXml, collectSitemapEntries } from './src/lib/sitemap'
//   import { getBlogSitemapEntries, getDocsSitemapEntries } from './src/lib/content'
//   '/sitemap.xml': () => new Response(
//     buildSitemapXml(collectSitemapEntries(getBlogSitemapEntries(), getDocsSitemapEntries())),
//     { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
//   ),
//
// This file is intentionally empty — no TanStack route export needed.
// TanStack Start v1.166.11 does not have createServerFileRoute.
export {}
