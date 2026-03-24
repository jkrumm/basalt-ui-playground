import type { HeadingItem } from '../../../lib/collection'
import type { BlockFrontmatter } from '../../../lib/content'
import { NonIdealState } from '@blueprintjs/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMemo } from 'react'
import { BlockLayout } from '../../../components/content/BlockLayout'
import { mdxComponents } from '../../../components/mdx/MDXComponents'
import { blocksCollection } from '../../../lib/content'

const BASE_URL = 'https://cbbi.jkrumm.com'

interface BlockLoaderData {
  slug: string
  frontmatter: BlockFrontmatter
  headings: HeadingItem[]
}

export const Route = createFileRoute('/_content/blocks/$slug')({
  loader: ({ params }): BlockLoaderData => {
    const { slug } = params
    const metaKey = `../content/blocks/${slug}.mdx`
    if (!blocksCollection.meta[metaKey])
      throw notFound()

    return {
      slug,
      frontmatter: blocksCollection.getBySlug(slug),
      headings: blocksCollection.getHeadings(slug),
    }
  },
  head: ({ loaderData: ld }) => {
    if (!ld)
      return {}
    const fm = ld.frontmatter
    const url = `${BASE_URL}/blocks/${ld.slug}`
    return {
      meta: [
        { title: `${fm.title} — CBBI Blueprint` },
        { name: 'description', content: fm.description },
        ...(fm.noindex ? [{ name: 'robots', content: 'noindex' }] : []),
        { property: 'og:title', content: fm.title },
        { property: 'og:description', content: fm.description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
      ],
      links: [{ rel: 'canonical', href: url }],
    }
  },
  component: BlockPage,
})

function BlockPage() {
  const { slug, frontmatter, headings } = Route.useLoaderData()
  const MdxContent = useMemo(() => blocksCollection.getComponent(slug), [slug])

  return (
    <BlockLayout frontmatter={frontmatter} headings={headings}>
      {MdxContent
        ? <MdxContent components={mdxComponents} /> // eslint-disable-line react-hooks/static-components -- stable import.meta.glob reference
        : <NonIdealState icon={<IconAlertCircle size={40} />} title="Failed to load block" />}
    </BlockLayout>
  )
}
