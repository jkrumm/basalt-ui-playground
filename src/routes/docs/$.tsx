import type { DocsFrontmatter } from '../../lib/content'
import { NonIdealState } from '@blueprintjs/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { DocsLayout } from '../../components/content/DocsLayout'
import { mdxComponents } from '../../components/mdx/MDXComponents'
import { docsMeta, docsModules, getDocsSidebar } from '../../lib/content'

interface DocsPageData {
  moduleKey: string
  frontmatter: DocsFrontmatter
  sections: ReturnType<typeof getDocsSidebar>
}

export const Route = createFileRoute('/docs/$')({
  loader: ({ params }): DocsPageData => {
    const splat = params._splat ?? ''
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

    return { moduleKey, frontmatter: fm!, sections: getDocsSidebar() }
  },
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
        : <NonIdealState icon={<IconAlertCircle size={40} />} title="Page not found" />}
    </DocsLayout>
  )
}
