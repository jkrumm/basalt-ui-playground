import type { Static } from '@sinclair/typebox'
import type { ContentModule, ContentType, HeadingItem, SearchDocument, SitemapEntry } from './collection'
import { Type } from '@sinclair/typebox'
import { defineCollection } from './collection'

export type { ContentType, HeadingItem, SearchDocument, SitemapEntry }
export { defineCollection }

export const INDEX_SUFFIX_RE = /\/index$/

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
  // Injected at build time by the remarkReadingTime remark plugin.
  readingTime: Type.Optional(Type.String()),
})

export const DocsFrontmatterSchema = Type.Object({
  title: Type.String(),
  description: Type.Optional(Type.String()),
  order: Type.Optional(Type.Number()),
  section: Type.Optional(Type.String()),
})

export const GuideFrontmatterSchema = Type.Object({
  title: Type.String(),
  description: Type.String(),
  publishedAt: Type.String(),
  updatedAt: Type.Optional(Type.String()),
  category: Type.String(),
  difficulty: Type.Union([
    Type.Literal('beginner'),
    Type.Literal('intermediate'),
    Type.Literal('advanced'),
  ]),
  estimatedTime: Type.Optional(Type.String()),
  tags: Type.Array(Type.String()),
  prerequisites: Type.Optional(Type.Array(Type.String())),
  draft: Type.Optional(Type.Boolean()),
  // Injected at build time by the remarkReadingTime remark plugin.
  readingTime: Type.Optional(Type.String()),
})

export const BlockFrontmatterSchema = Type.Object({
  title: Type.String(),
  description: Type.String(),
  category: Type.String(),
  tags: Type.Array(Type.String()),
  component: Type.Optional(Type.String()),
  draft: Type.Optional(Type.Boolean()),
})

export type BlogFrontmatter = Static<typeof BlogFrontmatterSchema>
export type DocsFrontmatter = Static<typeof DocsFrontmatterSchema>
export type GuideFrontmatter = Static<typeof GuideFrontmatterSchema>
export type BlockFrontmatter = Static<typeof BlockFrontmatterSchema>

// ---------------------------------------------------------------------------
// Glob imports — eager so modules are synchronously available during SSR.
// NOTE: import.meta.glob() requires string literals here — cannot be moved
// into a factory function.
// ---------------------------------------------------------------------------

const _blogMeta = import.meta.glob<unknown>(
  '../content/blog/*.mdx',
  { eager: true, import: 'frontmatter' },
)
const _blogModules = import.meta.glob<ContentModule<BlogFrontmatter>>(
  '../content/blog/*.mdx',
  { eager: true },
)

const _docsMeta = import.meta.glob<unknown>(
  '../content/docs/**/*.mdx',
  { eager: true, import: 'frontmatter' },
)
const _docsModules = import.meta.glob<ContentModule<DocsFrontmatter>>(
  '../content/docs/**/*.mdx',
  { eager: true },
)

const _guidesMeta = import.meta.glob<unknown>(
  '../content/guides/*.mdx',
  { eager: true, import: 'frontmatter' },
)
const _guidesModules = import.meta.glob<ContentModule<GuideFrontmatter>>(
  '../content/guides/*.mdx',
  { eager: true },
)

const _blocksMeta = import.meta.glob<unknown>(
  '../content/blocks/*.mdx',
  { eager: true, import: 'frontmatter' },
)
const _blocksModules = import.meta.glob<ContentModule<BlockFrontmatter>>(
  '../content/blocks/*.mdx',
  { eager: true },
)

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export const blogCollection = defineCollection({
  schema: BlogFrontmatterSchema,
  meta: _blogMeta,
  modules: _blogModules,
  slugify: path => path.replace('../content/blog/', '').replace('.mdx', ''),
  sort: (a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt),
})

export const docsCollection = defineCollection({
  schema: DocsFrontmatterSchema,
  meta: _docsMeta,
  modules: _docsModules,
  slugify: path => path.replace('../content/docs/', '').replace('.mdx', ''),
})

export const guidesCollection = defineCollection({
  schema: GuideFrontmatterSchema,
  meta: _guidesMeta,
  modules: _guidesModules,
  slugify: path => path.replace('../content/guides/', '').replace('.mdx', ''),
  sort: (a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt),
})

export const blocksCollection = defineCollection({
  schema: BlockFrontmatterSchema,
  meta: _blocksMeta,
  modules: _blocksModules,
  slugify: path => path.replace('../content/blocks/', '').replace('.mdx', ''),
})

// ---------------------------------------------------------------------------
// Legacy raw-map aliases (some routes still use them for key-existence checks)
// ---------------------------------------------------------------------------

export const docsMeta = _docsMeta as Record<string, DocsFrontmatter>
export const docsModules = _docsModules

// ---------------------------------------------------------------------------
// Blog helpers
// ---------------------------------------------------------------------------

export interface BlogPost {
  slug: string
  frontmatter: BlogFrontmatter
  readingTime: string
}

export function getBlogList(): BlogPost[] {
  return blogCollection.getAll().map(({ slug, frontmatter }) => ({
    slug,
    frontmatter,
    readingTime: frontmatter.readingTime ?? '1 min read',
  }))
}

export function getBlogFrontmatter(slug: string): BlogFrontmatter {
  return blogCollection.getBySlug(slug)
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = blogCollection.getBySlug(slug)

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

export function getSeriesPosts(series: string): BlogPost[] {
  return getBlogList()
    .filter(p => p.frontmatter.series === series)
    .sort((a, b) => (a.frontmatter.seriesOrder ?? 0) - (b.frontmatter.seriesOrder ?? 0))
}

export interface PrevNext {
  prev: BlogPost | null
  next: BlogPost | null
}

export function getPrevNextPosts(slug: string): PrevNext {
  const posts = getBlogList()
  const idx = posts.findIndex(p => p.slug === slug)
  if (idx === -1)
    return { prev: null, next: null }
  return {
    prev: posts[idx + 1] ?? null,
    next: posts[idx - 1] ?? null,
  }
}

// ---------------------------------------------------------------------------
// Docs helpers
// ---------------------------------------------------------------------------

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

  for (const [path, fm] of Object.entries(_docsMeta)) {
    const typed = fm as DocsFrontmatter | undefined
    if (!typed)
      continue
    const slug = path.replace('../content/docs/', '').replace('.mdx', '')
    const section = typed.section ?? 'General'
    if (!sections.has(section))
      sections.set(section, [])
    sections.get(section)!.push({ slug, label: typed.title, frontmatter: typed })
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

export function getNextDocPage(currentSlug: string): DocNavItem | null {
  const flat = getDocsSidebar().flatMap(s => s.items)
  const idx = flat.findIndex((item) => {
    const clean = item.slug.replace(INDEX_SUFFIX_RE, '')
    return clean === currentSlug || item.slug === currentSlug
  })
  return idx !== -1 ? (flat[idx + 1] ?? null) : null
}

// ---------------------------------------------------------------------------
// Guides helpers
// ---------------------------------------------------------------------------

export interface GuideItem {
  slug: string
  frontmatter: GuideFrontmatter
  readingTime: string
}

export function getGuideList(): GuideItem[] {
  return guidesCollection.getAll().map(({ slug, frontmatter }) => ({
    slug,
    frontmatter,
    readingTime: frontmatter.readingTime ?? '1 min read',
  }))
}

export function getGuideFrontmatter(slug: string): GuideFrontmatter {
  return guidesCollection.getBySlug(slug)
}

export function getPrevNextGuides(slug: string): { prev: GuideItem | null, next: GuideItem | null } {
  const guides = getGuideList()
  const idx = guides.findIndex(g => g.slug === slug)
  if (idx === -1)
    return { prev: null, next: null }
  return {
    prev: guides[idx + 1] ?? null,
    next: guides[idx - 1] ?? null,
  }
}

// ---------------------------------------------------------------------------
// Blocks helpers
// ---------------------------------------------------------------------------

export interface BlockItem {
  slug: string
  frontmatter: BlockFrontmatter
}

export function getBlockList(): BlockItem[] {
  return blocksCollection.getAll()
}

export function getBlockFrontmatter(slug: string): BlockFrontmatter {
  return blocksCollection.getBySlug(slug)
}

// ---------------------------------------------------------------------------
// Search index for Fuse.js — all four content types
// ---------------------------------------------------------------------------

export function getSearchIndex(): SearchDocument[] {
  const blog = blogCollection.getSearchDocuments((slug, fm) => ({
    type: 'blog' as const,
    slug,
    title: fm.title,
    description: fm.description,
    tags: fm.tags,
  }))

  const docs = docsCollection.getSearchDocuments((slug, fm) => ({
    type: 'docs' as const,
    slug,
    title: fm.title,
    description: fm.description ?? '',
    section: fm.section,
  }))

  const guides = guidesCollection.getSearchDocuments((slug, fm) => ({
    type: 'guide' as const,
    slug,
    title: fm.title,
    description: fm.description,
    tags: fm.tags,
    category: fm.category,
  }))

  const blocks = blocksCollection.getSearchDocuments((slug, fm) => ({
    type: 'block' as const,
    slug,
    title: fm.title,
    description: fm.description,
    tags: fm.tags,
    category: fm.category,
  }))

  return [...blog, ...docs, ...guides, ...blocks]
}

// ---------------------------------------------------------------------------
// Sitemap helpers
// ---------------------------------------------------------------------------

export function getBlogSitemapEntries(): SitemapEntry[] {
  return blogCollection.getSitemapEntries((slug, fm) => ({
    url: `/blog/${slug}`,
    lastmod: fm.updatedAt ?? fm.publishedAt,
  }))
}

export function getDocsSitemapEntries(): SitemapEntry[] {
  return Object.keys(_docsMeta).map((path) => {
    const slug = path.replace('../content/docs/', '').replace('.mdx', '')
    const url = slug === 'index' ? '/docs' : `/docs/${slug.replace(INDEX_SUFFIX_RE, '')}`
    return { url }
  })
}

export function getGuidesSitemapEntries(): SitemapEntry[] {
  return guidesCollection.getSitemapEntries((slug, fm) => ({
    url: `/guides/${slug}`,
    lastmod: fm.updatedAt ?? fm.publishedAt,
  }))
}

export function getBlocksSitemapEntries(): SitemapEntry[] {
  return blocksCollection.getSitemapEntries(slug => ({ url: `/blocks/${slug}` }))
}
