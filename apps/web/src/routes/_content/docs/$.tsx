import type { HeadingItem } from '../../../lib/collection'
import type { DocsFrontmatter } from '../../../lib/content'
import { NonIdealState } from '@blueprintjs/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMemo } from 'react'
import { DocsLayout } from '../../../components/content/DocsLayout'
import { mdxComponents } from '../../../components/mdx/MDXComponents'
import { docsCollection, docsMeta, getDocsSidebar } from '../../../lib/content'

interface DocsPageData {
  slug: string
  frontmatter: DocsFrontmatter
  headings: HeadingItem[]
  sections: ReturnType<typeof getDocsSidebar>
}

export const Route = createFileRoute('/_content/docs/$')({
  loader: ({ params }): DocsPageData => {
    const splat = params._splat ?? ''
    const directKey = `../content/docs/${splat}.mdx`
    const indexKey = `../content/docs/${splat}/index.mdx`

    let slug: string
    let fm: DocsFrontmatter | undefined

    if (docsMeta[directKey]) {
      slug = splat || 'index'
      fm = docsMeta[directKey]
    }
    else if (docsMeta[indexKey]) {
      slug = splat ? `${splat}/index` : 'index'
      fm = docsMeta[indexKey]
    }
    else {
      throw notFound()
    }

    return {
      slug,
      frontmatter: fm!,
      headings: docsCollection.getHeadings(slug),
      sections: getDocsSidebar(),
    }
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
  const { slug, headings, sections } = Route.useLoaderData()
  const MdxContent = useMemo(() => docsCollection.getComponent(slug), [slug])

  return (
    <DocsLayout sections={sections} headings={headings}>
      {MdxContent
        ? <MdxContent components={mdxComponents} /> // eslint-disable-line react-hooks/static-components -- stable import.meta.glob reference
        : <NonIdealState icon={<IconAlertCircle size={40} />} title="Page not found" />}
    </DocsLayout>
  )
}
