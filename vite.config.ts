import mdx from '@mdx-js/rollup'
import babel from '@rolldown/plugin-babel'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import viteReact from '@vitejs/plugin-react'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vite'
import { blueprintDarkTheme } from './src/lib/mdx-theme'
import rehypeShiki from '@shikijs/rehype'
import { transformerNotationHighlight, transformerNotationDiff } from '@shikijs/transformers'

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    // 1. MDX — must run before Vite/Rollup sees the JSX
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          [
            rehypeShiki,
            {
              theme: blueprintDarkTheme,
              transformers: [transformerNotationHighlight(), transformerNotationDiff()],
            },
          ],
        ],
      }),
    },
    tsConfigPaths(),
    tanstackStart(),
    // 2. React plugin must declare MDX as JSX-containing for HMR
    viteReact({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    // 3. React Compiler processes MDX-compiled output the same as .tsx
    babel({ presets: [reactCompilerPreset()] }),
    // 4. Sitemap dev middleware — serves /sitemap.xml in development
    {
      name: 'sitemap-dev',
      configureServer(server) {
        server.middlewares.use('/sitemap.xml', async (_req, res) => {
          try {
            const content = await server.ssrLoadModule('/src/lib/content.ts')
            const sitemap = await server.ssrLoadModule('/src/lib/sitemap.ts')
            const xml = sitemap.buildSitemapXml(
              sitemap.collectSitemapEntries(
                content.getBlogSitemapEntries(),
                content.getDocsSitemapEntries(),
              ),
            ) as string
            res.setHeader('Content-Type', 'application/xml; charset=utf-8')
            res.end(xml)
          } catch (e) {
            res.statusCode = 500
            res.end(`Sitemap generation failed: ${String(e)}`)
          }
        })
      },
    },
  ],
})
