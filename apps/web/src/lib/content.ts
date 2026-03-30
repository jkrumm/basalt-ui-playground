/**
 * Content helpers — typed API over the content-collections generated data.
 *
 * All frontmatter validation, slug computation, readingTime, heading extraction,
 * and MDX compilation happen at build time in content-collections.ts. This module
 * provides:
 *   - Re-exported collection types (Post, Doc, Guide, Block, HeadingItem)
 *   - Helper functions for sidebar navigation, related posts, search index, sitemap
 *
 * Rendering: use <MDXContent code={doc.body} components={mdxComponents} />
 * from @content-collections/mdx/react — no import.meta.glob maps needed.
 */

import { allBlocks, allDocs, allGuides, allPosts } from "content-collections";

// ── Re-exported collection types ─────────────────────────────────────────────

export type Post = (typeof allPosts)[number];
export type Doc = (typeof allDocs)[number];
export type Guide = (typeof allGuides)[number];
export type Block = (typeof allBlocks)[number];

/** Heading item shape — extracted at build time by content-collections. */
export type HeadingItem = Post["headings"][number];

// Backward-compat aliases (layouts / routes import these by their old names)
export type BlogFrontmatter = Post;
export type DocsFrontmatter = Doc;
export type GuideFrontmatter = Guide;
export type BlockFrontmatter = Block;
export type BlockItem = Block;

// ── INDEX_SUFFIX_RE ──────────────────────────────────────────────────────────

/** Strips trailing /index from doc slugs for clean URLs. */
export const INDEX_SUFFIX_RE = /\/index$/;

// ── Blog helpers ─────────────────────────────────────────────────────────────

// Compat alias — used by search.tsx and other callers
export type BlogPost = Post;
export interface PrevNext {
  prev: Post | null;
  next: Post | null;
}

export function getBlogList(): Post[] {
  return allPosts
    .filter((p) => !p.draft)
    .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const current = allPosts.find((p) => p.slug === slug);
  if (!current) return [];
  return getBlogList()
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .filter(({ score }) => score > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

export function getSeriesPosts(series: string): Post[] {
  return getBlogList()
    .filter((p) => p.series === series)
    .toSorted((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
}

export function getPrevNextPosts(slug: string): PrevNext {
  const posts = getBlogList();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return { prev: posts[idx + 1] ?? null, next: posts[idx - 1] ?? null };
}

// ── Docs helpers ─────────────────────────────────────────────────────────────

export interface DocNavItem {
  slug: string;
  label: string;
  section: string;
  order: number;
}

export interface DocNavSection {
  section: string;
  items: DocNavItem[];
}

export function getDocsSidebar(): DocNavSection[] {
  const sections = new Map<string, DocNavItem[]>();
  for (const doc of allDocs) {
    const section = doc.section ?? "General";
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section)!.push({
      slug: doc.slug,
      label: doc.title,
      section,
      order: doc.order ?? 999,
    });
  }
  const sorted: DocNavSection[] = [];
  for (const [section, items] of sections.entries()) {
    sorted.push({
      section,
      items: items.toSorted((a, b) =>
        a.order !== b.order ? a.order - b.order : a.label.localeCompare(b.label),
      ),
    });
  }
  return sorted.toSorted((a, b) => a.section.localeCompare(b.section));
}

export function getNextDocPage(currentSlug: string): DocNavItem | null {
  const flat = getDocsSidebar().flatMap((s) => s.items);
  const idx = flat.findIndex((item) => {
    const clean = item.slug.replace(INDEX_SUFFIX_RE, "");
    return clean === currentSlug || item.slug === currentSlug;
  });
  return idx !== -1 ? (flat[idx + 1] ?? null) : null;
}

// ── Guides helpers ───────────────────────────────────────────────────────────

// Compat alias
export type GuideItem = Guide;

export function getGuideList(): Guide[] {
  return allGuides
    .filter((g) => !g.draft)
    .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPrevNextGuides(slug: string): { prev: Guide | null; next: Guide | null } {
  const guides = getGuideList();
  const idx = guides.findIndex((g) => g.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return { prev: guides[idx + 1] ?? null, next: guides[idx - 1] ?? null };
}

// ── Blocks helpers ───────────────────────────────────────────────────────────

export function getBlockList(): Block[] {
  return allBlocks;
}

// ── Search index ─────────────────────────────────────────────────────────────

export type ContentType = "blog" | "docs" | "guide" | "block";

export interface SearchDocument {
  type: ContentType;
  slug: string;
  title: string;
  description: string;
  tags?: string[];
  section?: string;
  category?: string;
}

export function getSearchIndex(): SearchDocument[] {
  const blog: SearchDocument[] = allPosts.map((p) => ({
    type: "blog",
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
  }));

  const docs: SearchDocument[] = allDocs.map((d) => ({
    type: "docs",
    slug: d.slug,
    title: d.title,
    description: d.description ?? "",
    section: d.section,
  }));

  const guides: SearchDocument[] = allGuides.map((g) => ({
    type: "guide",
    slug: g.slug,
    title: g.title,
    description: g.description,
    tags: g.tags,
    category: g.category,
  }));

  const blocks: SearchDocument[] = allBlocks.map((b) => ({
    type: "block",
    slug: b.slug,
    title: b.title,
    description: b.description,
    tags: b.tags,
    category: b.category,
  }));

  return [...blog, ...docs, ...guides, ...blocks];
}

// ── Sitemap helpers ──────────────────────────────────────────────────────────

export interface SitemapEntry {
  url: string;
  lastmod?: string;
}

export function getBlogSitemapEntries(): SitemapEntry[] {
  return allPosts.map((p) => ({
    url: `/blog/${p.slug}`,
    lastmod: p.updatedAt ?? p.publishedAt,
  }));
}

export function getDocsSitemapEntries(): SitemapEntry[] {
  return allDocs.map((d) => ({
    url: d.slug === "index" ? "/docs" : `/docs/${d.slug.replace(INDEX_SUFFIX_RE, "")}`,
  }));
}

export function getGuidesSitemapEntries(): SitemapEntry[] {
  return allGuides.map((g) => ({
    url: `/guides/${g.slug}`,
    lastmod: g.updatedAt ?? g.publishedAt,
  }));
}

export function getBlocksSitemapEntries(): SitemapEntry[] {
  return allBlocks.map((b) => ({ url: `/blocks/${b.slug}` }));
}
