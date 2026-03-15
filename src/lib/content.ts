import type { Static } from '@sinclair/typebox'
import type { MDXComponents } from 'mdx/types'
import type * as React from 'react'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

export const INDEX_SUFFIX_RE = /\/index$/
const RT_FRONTMATTER_RE = /^---[\s\S]*?---\n?/
const RT_IMPORT_RE = /^(import|export)\s.*/gm
const RT_JSX_TAG_RE = /<[^>]+>/g
const RT_FENCED_CODE_RE = /```[\s\S]*?```/g
const RT_INLINE_CODE_RE = /`[^`]*`/g
const RT_WHITESPACE_RE = /\s+/

// ---------------------------------------------------------------------------
// TypeBox schemas — runtime + compile-time validation
// ---------------------------------------------------------------------------

export const BlogFrontmatterSchema = Type.Object({
  title: Type.String(),
  description: Type.String(),
  publishedAt: Type.String(),
  updatedAt: Type.Optional(Type.String()),
  tags: Type.Array(Type.String()),
  author: Type.String(),
  draft: Type.Optional(Type.Boolean()),
  image: Type.Optional(Type.String()),
  series: Type.Optional(Type.String()),
  seriesOrder: Type.Optional(Type.Number()),
})

export const DocsFrontmatterSchema = Type.Object({
  title: Type.String(),
  description: Type.Optional(Type.String()),
  order: Type.Optional(Type.Number()),
  section: Type.Optional(Type.String()),
})

export type BlogFrontmatter = Static<typeof BlogFrontmatterSchema>
export type DocsFrontmatter = Static<typeof DocsFrontmatterSchema>

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

export const blogMeta = import.meta.glob<BlogFrontmatter>(
  '../content/blog/*.mdx',
  { eager: true, import: 'frontmatter' },
)

const blogRaw = import.meta.glob<string>(
  '../content/blog/*.mdx',
  { eager: true, query: '?raw', import: 'default' },
)

// Eager: all MDX components are included in the bundle for synchronous SSR rendering.
// No async loading needed — content pages are few and benefit from instant render.
export const blogModules = import.meta.glob<BlogModule>(
  '../content/blog/*.mdx',
  { eager: true },
)

export const docsMeta = import.meta.glob<DocsFrontmatter>(
  '../content/docs/**/*.mdx',
  { eager: true, import: 'frontmatter' },
)

export const docsModules = import.meta.glob<DocsModule>(
  '../content/docs/**/*.mdx',
  { eager: true },
)

// ---------------------------------------------------------------------------
// Inline reading-time (no Node.js deps, works browser + server)
// ---------------------------------------------------------------------------

function computeReadingTime(raw: string): string {
  const text = raw
    .replace(RT_FRONTMATTER_RE, '')
    .replace(RT_IMPORT_RE, '')
    .replace(RT_JSX_TAG_RE, ' ')
    .replace(RT_FENCED_CODE_RE, ' ')
    .replace(RT_INLINE_CODE_RE, ' ')
  const words = text.trim().split(RT_WHITESPACE_RE).filter(w => w.length > 0).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}

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

export interface SearchDocument {
  type: 'blog' | 'docs'
  slug: string
  title: string
  description: string
  tags?: string[]
  section?: string
}

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

function assertBlogFrontmatter(path: string, fm: unknown): BlogFrontmatter {
  if (import.meta.env.DEV && !Value.Check(BlogFrontmatterSchema, fm)) {
    const errors = [...Value.Errors(BlogFrontmatterSchema, fm)]
    console.warn(`[content] Invalid blog frontmatter in ${path}:`, errors)
  }
  return fm as BlogFrontmatter
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
        frontmatter: assertBlogFrontmatter(path, fm),
        readingTime: computeReadingTime(raw),
      }
    })
    .sort((a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt))
}

export function getBlogFrontmatter(slug: string): BlogFrontmatter {
  const key = `../content/blog/${slug}.mdx`
  const fm = blogMeta[key]
  if (!fm)
    throw new Error(`Blog post not found: ${slug}`)
  return assertBlogFrontmatter(key, fm)
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
// Related posts — tag-based similarity
// ---------------------------------------------------------------------------

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const currentKey = `../content/blog/${slug}.mdx`
  const current = blogMeta[currentKey]
  if (!current)
    return []

  return getBlogList()
    .filter(p => p.slug !== slug)
    .map(p => ({
      post: p,
      score: p.frontmatter.tags.filter(t => current.tags.includes(t)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post)
}

// ---------------------------------------------------------------------------
// Series — ordered multi-part articles
// ---------------------------------------------------------------------------

export function getSeriesPosts(series: string): BlogPost[] {
  return getBlogList()
    .filter(p => p.frontmatter.series === series)
    .sort((a, b) => (a.frontmatter.seriesOrder ?? 0) - (b.frontmatter.seriesOrder ?? 0))
}

// ---------------------------------------------------------------------------
// Search index for Fuse.js
// ---------------------------------------------------------------------------

export function getSearchIndex(): SearchDocument[] {
  const blog: SearchDocument[] = Object.entries(blogMeta)
    .filter(([, fm]) => fm && !fm.draft)
    .map(([path, fm]) => ({
      type: 'blog' as const,
      slug: path.replace('../content/blog/', '').replace('.mdx', ''),
      title: fm!.title,
      description: fm!.description,
      tags: fm!.tags,
    }))

  const docs: SearchDocument[] = Object.entries(docsMeta)
    .filter(([, fm]) => !!fm)
    .map(([path, fm]) => ({
      type: 'docs' as const,
      slug: path.replace('../content/docs/', '').replace('.mdx', ''),
      title: fm!.title,
      description: fm!.description ?? '',
      section: fm!.section,
    }))

  return [...blog, ...docs]
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
