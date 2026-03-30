/**
 * Content Collections — single source of truth for all MDX content.
 *
 * Handles the full MDX pipeline in one place:
 *   - Frontmatter parsing and Zod validation at build time
 *   - MDX compilation to serialized code string via compileMDX (mdx-bundler)
 *   - Code syntax highlighting via Shiki (pre-initialized, reused across files)
 *   - Heading extraction with github-slugger (same as rehype-slug → IDs match)
 *   - Reading time and slug computation
 *
 * Rendering uses <MDXContent code={doc.body} components={...} /> from
 * @content-collections/mdx/react — no import.meta.glob maps needed.
 */

import { defineCollection, defineConfig } from "@content-collections/core";
import { type Options as MdxOptions, compileMDX } from "@content-collections/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerMetaHighlight,
} from "@shikijs/transformers";
import Slugger from "github-slugger";
import { z } from "zod";
import { blueprintDarkTheme } from "./src/lib/mdx-theme.ts";

// ── Heading extraction ───────────────────────────────────────────────────────
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

// ── Shared rehype/remark plugin config ────────────────────────────────────────
// Defined once, reused across all four compileMDX calls.

const shikiOptions = {
  theme: blueprintDarkTheme,
  transformers: [
    transformerNotationHighlight(),
    transformerNotationDiff(),
    transformerNotationFocus(),
    transformerNotationErrorLevel(),
    transformerMetaHighlight(),
  ],
  parseMetaString(meta: string) {
    const match = /filename="([^"]+)"/.exec(meta);
    if (match?.[1]) return { "data-filename": match[1] };
  },
};

const mdxOptions: MdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      {
        behavior: "append",
        properties: { className: ["heading-anchor"], ariaLabel: "Link to section" },
      },
    ],
    [rehypeShiki, shikiOptions],
  ],
};

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
  transform: async (doc, context) => {
    const { content, _meta, ...frontmatter } = doc;
    const body = await compileMDX(context, doc, mdxOptions);
    return {
      ...frontmatter,
      slug: _meta.path,
      body,
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
  transform: async (doc, context) => {
    const { content, _meta, ...frontmatter } = doc;
    const body = await compileMDX(context, doc, mdxOptions);
    return {
      ...frontmatter,
      slug: _meta.path,
      body,
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
  transform: async (doc, context) => {
    const { content, _meta, ...frontmatter } = doc;
    const body = await compileMDX(context, doc, mdxOptions);
    return {
      ...frontmatter,
      slug: _meta.path,
      body,
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
  transform: async (doc, context) => {
    const { content, _meta, ...frontmatter } = doc;
    const body = await compileMDX(context, doc, mdxOptions);
    return {
      ...frontmatter,
      slug: _meta.path,
      body,
      headings: extractHeadings(content),
    };
  },
});

export default defineConfig({ content: [posts, docs, guides, blocks] });
