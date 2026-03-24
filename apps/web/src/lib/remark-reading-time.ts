/**
 * Remark plugin: compute reading time from MDX source and inject it into frontmatter.
 *
 * Run order: after remark-frontmatter (which sets file.data.matter from YAML),
 * before remark-mdx-frontmatter (which exports file.data.matter as the frontmatter
 * named export). This makes readingTime available as frontmatter.readingTime
 * in the compiled module without any runtime computation or ?raw imports.
 */

// Strips markup noise from MDX source to count prose words only.
const RE_FRONTMATTER = /^---[\s\S]*?---\n?/
const RE_IMPORTS = /^(import|export)\s.*/gm
const RE_JSX = /<[^>]+>/g
const RE_FENCED = /```[\s\S]*?```/g
const RE_INLINE = /`[^`]*`/g
const RE_WHITESPACE = /\s+/

export function remarkReadingTime() {
  return (
    _tree: unknown,
    file: { data: Record<string, unknown>, value: string | Uint8Array },
  ) => {
    const text = String(file.value)
      .replace(RE_FRONTMATTER, '')
      .replace(RE_IMPORTS, '')
      .replace(RE_JSX, ' ')
      .replace(RE_FENCED, ' ')
      .replace(RE_INLINE, ' ')
    const wordCount = text.trim().split(RE_WHITESPACE).filter(w => w.length > 0).length
    const minutes = Math.max(1, Math.round(wordCount / 200))
    file.data.matter = {
      ...(file.data.matter as Record<string, unknown> | undefined ?? {}),
      readingTime: `${minutes} min read`,
    }
  }
}
