import type { Static, TObject } from '@sinclair/typebox'
import type { MDXComponents } from 'mdx/types'
import type * as React from 'react'
import { Value } from '@sinclair/typebox/value'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface HeadingItem {
  id: string
  text: string
  depth: 2 | 3
}

export interface ContentModule<TFm> {
  default: React.ComponentType<{ components?: MDXComponents }>
  frontmatter: TFm
  headings?: HeadingItem[]
}

export interface CollectionItem<TFm> {
  slug: string
  frontmatter: TFm
}

export interface SitemapEntry {
  url: string
  lastmod?: string
}

export type ContentType = 'blog' | 'docs' | 'guide' | 'block'

export interface SearchDocument {
  type: ContentType
  slug: string
  title: string
  description: string
  tags?: string[]
  section?: string
  category?: string
}

// ---------------------------------------------------------------------------
// defineCollection factory
// ---------------------------------------------------------------------------
//
// NOTE: import.meta.glob() requires string literals at call sites — you cannot
// pass glob patterns to this factory. Call import.meta.glob() at the module
// level and pass the resulting maps here.
//

interface CollectionConfig<TSchema extends TObject> {
  schema: TSchema
  /** Result of import.meta.glob('...', { eager: true, import: 'frontmatter' }) */
  meta: Record<string, unknown>
  /** Result of import.meta.glob('...', { eager: true }) */
  modules: Record<string, ContentModule<Static<TSchema>>>
  /** Convert the glob file path to the public URL slug. */
  slugify: (path: string) => string
  /** Optional comparator for getAll(). Defaults to insertion order. */
  sort?: (a: CollectionItem<Static<TSchema>>, b: CollectionItem<Static<TSchema>>) => number
}

export function defineCollection<TSchema extends TObject>(config: CollectionConfig<TSchema>) {
  const { schema, meta, modules, slugify, sort } = config

  function validate(path: string, fm: unknown): Static<TSchema> {
    if (!Value.Check(schema, fm)) {
      const errors = [...Value.Errors(schema, fm)]
      const details = errors.map(e => `  ${e.path}: ${e.message}`).join('\n')
      throw new Error(`[content] Invalid frontmatter in ${path}:\n${details}`)
    }
    return fm as Static<TSchema>
  }

  function slugToMetaKey(slug: string): string | undefined {
    return Object.keys(meta).find(path => slugify(path) === slug)
  }

  function slugToModuleKey(slug: string): string | undefined {
    return Object.keys(modules).find(path => slugify(path) === slug)
  }

  /** All non-draft items, optionally sorted. */
  function getAll(): CollectionItem<Static<TSchema>>[] {
    const items = Object.entries(meta)
      .filter(([, fm]) => fm && !(fm as Record<string, unknown>).draft)
      .map(([path, fm]) => ({
        slug: slugify(path),
        frontmatter: validate(path, fm),
      }))
    return sort ? items.sort(sort) : items
  }

  /** Validated frontmatter for a single item. Throws if not found. */
  function getBySlug(slug: string): Static<TSchema> {
    const key = slugToMetaKey(slug)
    if (!key)
      throw new Error(`[content] Not found: ${slug}`)
    return validate(key, meta[key])
  }

  /** MDX default export for a slug, or undefined. */
  function getComponent(slug: string): React.ComponentType<{ components?: MDXComponents }> | undefined {
    const key = slugToModuleKey(slug)
    return key ? modules[key]?.default : undefined
  }

  /** Headings extracted at compile time by rehype-export-headings. */
  function getHeadings(slug: string): HeadingItem[] {
    const key = slugToModuleKey(slug)
    return (key ? modules[key]?.headings : undefined) ?? []
  }

  /** Sitemap entries for all non-draft items. */
  function getSitemapEntries(toUrl: (slug: string, fm: Static<TSchema>) => { url: string, lastmod?: string }): SitemapEntry[] {
    return getAll().map(({ slug, frontmatter }) => toUrl(slug, frontmatter))
  }

  /** Search documents for all non-draft items. */
  function getSearchDocuments(toDoc: (slug: string, fm: Static<TSchema>) => SearchDocument): SearchDocument[] {
    return getAll().map(({ slug, frontmatter }) => toDoc(slug, frontmatter))
  }

  return {
    getAll,
    getBySlug,
    getComponent,
    getHeadings,
    getSitemapEntries,
    getSearchDocuments,
    /** Raw maps for advanced use cases. */
    meta,
    modules,
  } as const
}
