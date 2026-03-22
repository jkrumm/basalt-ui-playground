import type { SitemapEntry } from './content'

const BASE_URL = 'https://cbbi.jkrumm.com'

const STATIC_ROUTES: SitemapEntry[] = [
  { url: '/' },
  { url: '/blog' },
  { url: '/docs' },
  { url: '/guides' },
  { url: '/blocks' },
]

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(({ url, lastmod }) => {
      const loc = `${BASE_URL}${url}`
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export function collectSitemapEntries(...entryGroups: SitemapEntry[][]): SitemapEntry[] {
  return [...STATIC_ROUTES, ...entryGroups.flat()]
}
