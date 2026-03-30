/**
 * Content Collections — single source of truth for all MDX content.
 *
 * Replaces the manual import.meta.glob + defineCollection + remark-frontmatter pipeline.
 * All four content types are defined here with Zod schemas and typed transforms.
 *
 * What this layer does:
 *   - Parses and validates frontmatter with Zod at build time
 *   - Computes slug, readingTime, and headings per document
 *   - Filters draft documents (excluded from allPosts etc.)
 *
 * What it does NOT do:
 *   - Compile MDX to React components — @mdx-js/rollup handles that via Vite,
 *     keeping efficient ES-module bundling and React Compiler compatibility.
 *
 * Usage in routes / content.ts:
 *   import { allPosts, allDocs, allGuides, allBlocks } from "content-collections";
 */

import { defineCollection, defineConfig } from "@content-collections/core";
import Slugger from "github-slugger";
import { z } from "zod";

// ── Heading extraction ───────────────────────────────────────────────────────
// Mirrors what rehype-slug does: parse markdown headings, slug the plain text.
// Uses github-slugger (same lib as rehype-slug) so TOC IDs match rendered HTML IDs.

type HeadingItem = {
  id: string;
  text: string;
  depth: 2 | 3;
};

const INLINE_MD = [
  [/\*\*(.+?)\*\*/g, "$1"], // **bold**
  [/\*(.+?)\*/g, "$1"], // *italic*
  [/`(.+?)`/g, "$1"], // `code`
  [/\[(.+?)\]\(.+?\)/g, "$1"], // [link](url)
] as const;

function extractHeadings(content: string): HeadingItem[] {
  const slugger = new Slugger();
  const headings: HeadingItem[] = [];
  const re = /^(#{2,3}) +(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const hashes = m[1];
    const rawText = m[2];
    if (!hashes || !rawText) continue;
    const depth = hashes.length as 2 | 3;
    let text = rawText.trim();
    for (const [pattern, replacement] of INLINE_MD) {
      text = text.replace(pattern, replacement);
    }
    headings.push({ id: slugger.slug(text), text, depth });
  }
  return headings;
}

// ── Reading time ─────────────────────────────────────────────────────────────

function computeReadingTime(content: string): string {
  const stripped = content
    .replace(/---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^(import|export)\s.*/gm, "");
  const words = stripped
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

// ── Shared base schema ───────────────────────────────────────────────────────

const base = {
  title: z.string(),
  draft: z.boolean().optional(),
  noindex: z.boolean().optional(),
};

// ── Blog posts ───────────────────────────────────────────────────────────────

const posts = defineCollection({
  name: "posts",
  directory: "src/content/blog",
  include: "*.mdx",
  schema: z.object({
    ...base,
    content: z.string(),
    description: z.string(),
    publishedAt: z.string(),
    updatedAt: z.string().optional(),
    tags: z.array(z.string()),
    author: z.string(),
    image: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalUrl: z.string().optional(),
    excerpt: z.string().optional(),
    authorUrl: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
  transform: (doc) => {
    const { content, _meta, ...frontmatter } = doc;
    return {
      ...frontmatter,
      slug: _meta.path,
      readingTime: computeReadingTime(content),
      headings: extractHeadings(content),
    };
  },
});

// ── Documentation ────────────────────────────────────────────────────────────

const docs = defineCollection({
  name: "docs",
  directory: "src/content/docs",
  include: "**/*.mdx",
  schema: z.object({
    ...base,
    content: z.string(),
    description: z.string().optional(),
    section: z.string().optional(),
    order: z.number().optional(),
  }),
  transform: (doc) => {
    const { content, _meta, ...frontmatter } = doc;
    return {
      ...frontmatter,
      slug: _meta.path,
      headings: extractHeadings(content),
    };
  },
});

// ── Guides ───────────────────────────────────────────────────────────────────

const guides = defineCollection({
  name: "guides",
  directory: "src/content/guides",
  include: "*.mdx",
  schema: z.object({
    ...base,
    content: z.string(),
    description: z.string(),
    publishedAt: z.string(),
    updatedAt: z.string().optional(),
    category: z.string(),
    difficulty: z.union([z.literal("beginner"), z.literal("intermediate"), z.literal("advanced")]),
    estimatedTime: z.string().optional(),
    tags: z.array(z.string()),
    prerequisites: z.array(z.string()).optional(),
    author: z.string().optional(),
    ogImage: z.string().optional(),
  }),
  transform: (doc) => {
    const { content, _meta, ...frontmatter } = doc;
    return {
      ...frontmatter,
      slug: _meta.path,
      readingTime: computeReadingTime(content),
      headings: extractHeadings(content),
    };
  },
});

// ── Blocks ───────────────────────────────────────────────────────────────────

const blocks = defineCollection({
  name: "blocks",
  directory: "src/content/blocks",
  include: "*.mdx",
  schema: z.object({
    ...base,
    content: z.string(),
    description: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    component: z.string().optional(),
    previewUrl: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
  }),
  transform: (doc) => {
    const { content, _meta, ...frontmatter } = doc;
    return {
      ...frontmatter,
      slug: _meta.path,
      headings: extractHeadings(content),
    };
  },
});

export default defineConfig({ content: [posts, docs, guides, blocks] });
