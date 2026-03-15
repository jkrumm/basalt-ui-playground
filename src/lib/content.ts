import type { MDXComponents } from 'mdx/types'
import type * as React from 'react'
import readingTime from 'reading-time'

const INDEX_SUFFIX_RE = /\/index$/

// ---------------------------------------------------------------------------
// Frontmatter types
// ---------------------------------------------------------------------------

export interface BlogFrontmatter {
  title: string
  description: string
  publishedAt: string // ISO: "2026-01-15"
  updatedAt?: string
  tags: string[]
  author: string
  draft?: boolean
}

export interface DocsFrontmatter {
  title: string
  description?: string
  order?: number // sidebar sort within section
  section?: string // sidebar group label
}

// ---------------------------------------------------------------------------
// Module shapes
// ---------------------------------------------------------------------------

export interface BlogModule {
  default: React.ComponentType<{ components?: MDXComponents }>
  frontmatter: BlogFrontmatter
}

export interface DocsModule {
  default: React.ComponentType<{ components?: MDXComponents }>
  frontmatter: DocsFrontmatter
}

// ---------------------------------------------------------------------------
// Glob imports
// ---------------------------------------------------------------------------

// Frontmatter-only (import: 'frontmatter') — used for listings and sidebar.
// Only the named `frontmatter` export is loaded; no JSX tree in the bundle.
export const blogMeta = import.meta.glob<BlogFrontmatter>(
  '../content/blog/*.mdx',
  { eager: true, import: 'frontmatter' },
)

// Raw sources — used for reading-time computation
const blogRaw = import.meta.glob<string>(
  '../content/blog/*.mdx',
  { eager: true, query: '?raw', import: 'default' },
)

// Full modules — used for rendering a specific post
export const blogModules = import.meta.glob<BlogModule>('../content/blog/*.mdx')

export const docsMeta = import.meta.glob<DocsFrontmatter>(
  '../content/docs/**/*.mdx',
  { eager: true, import: 'frontmatter' },
)

// Full modules — used for rendering a specific doc page
export const docsModules = import.meta.glob<DocsModule>('../content/docs/**/*.mdx')

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export interface BlogPost {
  slug: string
  frontmatter: BlogFrontmatter
  readingTime: string
}

export interface SitemapEntry {
  url: string
  lastmod?: string
}

// ---------------------------------------------------------------------------
// Content collection builders
// ---------------------------------------------------------------------------

export function getBlogList(): BlogPost[] {
  return Object.entries(blogMeta)
    .filter(([, fm]) => fm && !fm.draft)
    .map(([path, fm]) => {
      const slug = path.replace('../content/blog/', '').replace('.mdx', '')
      const raw = blogRaw[path] ?? ''
      return {
        slug,
        frontmatter: fm!,
        readingTime: readingTime(raw).text,
      }
    })
    .sort((a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt))
}

export function getBlogFrontmatter(slug: string): BlogFrontmatter {
  const key = `../content/blog/${slug}.mdx`
  const fm = blogMeta[key]
  if (!fm)
    throw new Error(`Blog post not found: ${slug}`)
  return fm
}

export function getDocsFrontmatter(key: string): DocsFrontmatter {
  const fm = docsMeta[key]
  if (!fm)
    throw new Error(`Docs page not found: ${key}`)
  return fm
}

export interface DocNavItem {
  slug: string
  label: string
  frontmatter: DocsFrontmatter
}

export interface DocNavSection {
  section: string
  items: DocNavItem[]
}

export function getDocsSidebar(): DocNavSection[] {
  const sections: Map<string, DocNavItem[]> = new Map()

  for (const [path, fm] of Object.entries(docsMeta)) {
    if (!fm)
      continue
    const slug = path.replace('../content/docs/', '').replace('.mdx', '')
    const section = fm.section ?? 'General'
    if (!sections.has(section))
      sections.set(section, [])
    sections.get(section)!.push({ slug, label: fm.title, frontmatter: fm })
  }

  // Sort items within each section by order, then by title
  const sorted: DocNavSection[] = []
  for (const [section, items] of sections.entries()) {
    sorted.push({
      section,
      items: items.toSorted((a, b) => {
        const ao = a.frontmatter.order ?? 999
        const bo = b.frontmatter.order ?? 999
        return ao !== bo ? ao - bo : a.label.localeCompare(b.label)
      }),
    })
  }

  return sorted.toSorted((a, b) => a.section.localeCompare(b.section))
}

// ---------------------------------------------------------------------------
// Sitemap helpers
// ---------------------------------------------------------------------------

export function getBlogSitemapEntries(): SitemapEntry[] {
  return Object.entries(blogMeta)
    .filter(([, fm]) => fm && !fm.draft)
    .map(([path, fm]) => {
      const slug = path.replace('../content/blog/', '').replace('.mdx', '')
      return {
        url: `/blog/${slug}`,
        lastmod: fm?.updatedAt ?? fm?.publishedAt,
      }
    })
}

export function getDocsSitemapEntries(): SitemapEntry[] {
  return Object.keys(docsMeta).map((path) => {
    const slug = path.replace('../content/docs/', '').replace('.mdx', '')
    const url = slug === 'index' ? '/docs' : `/docs/${slug.replace(INDEX_SUFFIX_RE, '')}`
    return { url }
  })
}
