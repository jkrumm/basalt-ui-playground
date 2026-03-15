import type { DocsFrontmatter } from '../../lib/content'
import { NonIdealState } from '@blueprintjs/core'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { DocsLayout } from '../../components/content/DocsLayout'
import { mdxComponents } from '../../components/mdx/MDXComponents'
import { docsMeta, docsModules, getDocsSidebar } from '../../lib/content'

const DOCS_INDEX_KEY = '../content/docs/index.mdx'

interface DocsIndexData {
  frontmatter: DocsFrontmatter
  sections: ReturnType<typeof getDocsSidebar>
}

const getDocsIndexFn = createServerFn({ method: 'GET' }).handler((): DocsIndexData => {
  const fm = docsMeta[DOCS_INDEX_KEY]
  if (!fm)
    throw new Error('Docs index not found')
  return { frontmatter: fm, sections: getDocsSidebar() }
})

export const Route = createFileRoute('/docs/')({
  loader: () => getDocsIndexFn(),
  head: ({ loaderData: ld }) => {
    if (!ld)
      return {}
    return {
      meta: [
        { title: `${ld.frontmatter.title} — CBBI Blueprint` },
        { name: 'description', content: ld.frontmatter.description },
      ],
      links: [{ rel: 'canonical', href: 'https://cbbi.jkrumm.com/docs' }],
    }
  },
  component: DocsIndexPage,
})

function DocsIndexPage() {
  const { sections } = Route.useLoaderData()
  const MdxContent = docsModules[DOCS_INDEX_KEY]?.default

  return (
    <DocsLayout sections={sections}>
      {MdxContent
        ? <MdxContent components={mdxComponents} />
        : <NonIdealState icon="error" title="Page not found" />}
    </DocsLayout>
  )
}
