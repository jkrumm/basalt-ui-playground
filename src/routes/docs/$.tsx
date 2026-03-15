import type { DocsFrontmatter } from '../../lib/content'
import { NonIdealState } from '@blueprintjs/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { DocsLayout } from '../../components/content/DocsLayout'
import { mdxComponents } from '../../components/mdx/MDXComponents'
import { docsMeta, docsModules, getDocsSidebar } from '../../lib/content'

interface DocsPageData {
  moduleKey: string
  frontmatter: DocsFrontmatter
  sections: ReturnType<typeof getDocsSidebar>
}

const getDocsPageFn = createServerFn({ method: 'GET' })
  .inputValidator((splat: unknown): string => {
    if (typeof splat !== 'string')
      throw new Error('Invalid path')
    return splat
  })
  .handler(async ({ data: splat }): Promise<DocsPageData> => {
    const sections = getDocsSidebar()

    const directKey = `../content/docs/${splat}.mdx`
    const indexKey = `../content/docs/${splat}/index.mdx`

    let moduleKey: string
    let fm: DocsFrontmatter | undefined

    if (docsMeta[directKey]) {
      moduleKey = directKey
      fm = docsMeta[directKey]
    }
    else if (docsMeta[indexKey]) {
      moduleKey = indexKey
      fm = docsMeta[indexKey]
    }
    else {
      throw notFound()
    }

    return { moduleKey, frontmatter: fm!, sections }
  })

export const Route = createFileRoute('/docs/$')({
  loader: ({ params }) => getDocsPageFn({ data: params._splat ?? '' }),
  head: ({ loaderData: ld, params }) => {
    if (!ld)
      return {}
    return {
      meta: [
        { title: `${ld.frontmatter.title} — CBBI Blueprint` },
        { name: 'description', content: ld.frontmatter.description },
      ],
      links: [{ rel: 'canonical', href: `https://cbbi.jkrumm.com/docs/${params._splat ?? ''}` }],
    }
  },
  component: DocsPage,
})

function DocsPage() {
  const { moduleKey, sections } = Route.useLoaderData()
  const MdxContent = docsModules[moduleKey]?.default

  return (
    <DocsLayout sections={sections}>
      {MdxContent
        ? <MdxContent components={mdxComponents} />
        : <NonIdealState icon="error" title="Page not found" />}
    </DocsLayout>
  )
}
