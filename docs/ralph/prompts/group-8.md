# Group 8: Content Collections + MDX

## What You're Doing

Port the entire content pipeline — blog, docs, guides, and blocks collections with MDX rendering, syntax highlighting, search, and SSG prerendering. This is a large group because the content system is tightly coupled.

---

## Research & Exploration First

1. Research: `@content-collections/vite` compatibility with Vite 8. If it doesn't support Vite 8, research alternatives: `fumadocs-mdx`, raw Vite plugin with `mdx-bundler`, or `@mdx-js/rollup`
2. Research: `@content-collections/core` latest API and configuration
3. Research: Shiki 4.x latest API — transformers, themes, language support
4. Research: TanStack Start SSG prerendering config — `crawlLinks` pattern, `prerender` option
5. Read the existing content-collections setup: `apps/web/content-collections.ts`
6. Read existing content route files to understand routing patterns
7. Read existing MDX components in `src/components/mdx/`
8. Read existing content components in `src/components/content/`
9. Read existing search implementation (`SearchModal.tsx`)

---

## What to Implement

### 1. Add Dependencies

- `@content-collections/core`, `@content-collections/vite` (or alternative if Vite 8 incompatible)
- `shiki` (4.x)
- `@mdx-js/react` or equivalent for MDX rendering
- `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`
- `github-slugger` (for TOC heading extraction)
- `reading-time`

### 2. content-collections.ts — Collection Configuration

Port from existing. Four collections:
- **posts** (`content/blog/*.mdx`) — blog posts with frontmatter (title, date, tags, excerpt)
- **docs** (`content/docs/*.mdx`) — developer documentation
- **guides** (`content/guides/*.mdx`) — step-by-step guides
- **blocks** (`content/blocks/*.mdx`) — component showcases

Each collection has:
- Zod v4 frontmatter validation
- MDX compilation (remark-gfm, rehype-slug, rehype-autolink-headings)
- Shiki syntax highlighting (dark theme, diff/focus/highlight transformers)
- Heading extraction via github-slugger (for TOC)
- Reading time calculation

### 3. Wire into Vite Config

Add the content-collections Vite plugin to `vite.config.ts`.

### 4. Port MDX Content Files

Copy MDX files from existing `apps/web/src/content/`:
- `content/blog/` — blog posts
- `content/docs/` — documentation
- `content/guides/` — guides
- `content/blocks/` — component blocks

### 5. Port MDX Component Library

Port from `src/components/mdx/`:
- `MDXComponents.tsx` — component mapping for MDX rendering
- `CodeBlock.tsx` — syntax-highlighted code blocks
- `Admonition.tsx` — info/warning/danger callouts
- `Steps.tsx` — numbered step components
- `MermaidDiagram.tsx` — Mermaid diagram rendering
- `PackageManagerTabs.tsx` — npm/yarn/pnpm/bun tabs
- `MDXTabsWrapper.tsx` — generic tab wrapper
- Stubs for PlantUML, Excalidraw, BPMN

### 6. Port Content Layout Components

Port from `src/components/content/`:
- `BlogLayout.tsx`, `BlogPostCard.tsx`, `RelatedPosts.tsx`
- `DocsLayout.tsx`, `DocsSidebar.tsx`
- `GuideLayout.tsx`
- `BlockLayout.tsx`

### 7. Create Content Routes

Using TanStack Router's layout route pattern:

```
src/routes/
  _content/
    blog/
      index.tsx       # Blog listing
      $slug.tsx       # Blog post
    docs/
      index.tsx       # Docs listing
      $slug.tsx       # Doc page
    guides/
      index.tsx       # Guides listing
      $slug.tsx       # Guide page
    blocks/
      index.tsx       # Blocks listing
      $slug.tsx       # Block page
```

The `_content` layout wraps content pages with appropriate navigation.

### 8. Port Search

- `SearchModal.tsx` — search across all collections
- Wire to a keyboard shortcut (Cmd+K)
- Search route at `/_content/search.tsx`

### 9. SSG Configuration

Update `vite.config.ts` with prerender config:
```typescript
prerender: {
  crawlLinks: true,
  routes: ["/", "/blog", "/docs", "/search"],
}
```

### 10. Sitemap + llms.txt

Wire up sitemap.xml and llms.txt generation for content pages. These can be build-time generated files or server-rendered routes.

---

## Validation

```bash
bun install

# Dev mode — content renders
bun run dev:web &
curl http://localhost:7712/blog              # Blog listing renders
curl http://localhost:7712/docs              # Docs listing renders
kill %1

# Build — SSG prerenders content
bun run build
# Check that prerendered HTML exists for content pages

bun run typecheck
```

---

## Commit

```
feat(content): port content collections with MDX, syntax highlighting, and SSG
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 8
```
