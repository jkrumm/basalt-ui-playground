import type { GuideFrontmatter, GuideItem, HeadingItem } from '../../lib/content'
import { NonIdealState } from '@blueprintjs/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMemo } from 'react'
import { GuideLayout } from '../../components/content/GuideLayout'
import { mdxComponents } from '../../components/mdx/MDXComponents'
import { getGuideList, getPrevNextGuides, guidesCollection } from '../../lib/content'

const BASE_URL = 'https://cbbi.jkrumm.com'

interface GuideLoaderData {
  slug: string
  frontmatter: GuideFrontmatter
  readingTime: string
  headings: HeadingItem[]
  prevNext: { prev: GuideItem | null, next: GuideItem | null }
}

export const Route = createFileRoute('/guides/$slug')({
  loader: ({ params }): GuideLoaderData => {
    const { slug } = params
    const metaKey = `../content/guides/${slug}.mdx`
    if (!guidesCollection.meta[metaKey])
      throw notFound()

    const fm = guidesCollection.getBySlug(slug)
    const guide = getGuideList().find(g => g.slug === slug)

    return {
      slug,
      frontmatter: fm,
      readingTime: guide?.readingTime ?? '1 min read',
      headings: guidesCollection.getHeadings(slug),
      prevNext: getPrevNextGuides(slug),
    }
  },
  head: ({ loaderData: ld }) => {
    if (!ld)
      return {}
    const fm = ld.frontmatter
    const url = `${BASE_URL}/guides/${ld.slug}`
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': fm.title,
      'description': fm.description,
      'datePublished': fm.publishedAt,
      'dateModified': fm.updatedAt ?? fm.publishedAt,
      url,
      'keywords': fm.tags.join(', '),
    }
    return {
      meta: [
        { title: `${fm.title} — CBBI Blueprint` },
        { name: 'description', content: fm.description },
        { property: 'og:title', content: fm.title },
        { property: 'og:description', content: fm.description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
        { name: 'article:published_time', content: fm.publishedAt },
        ...(fm.updatedAt ? [{ name: 'article:modified_time', content: fm.updatedAt }] : []),
        ...fm.tags.map(tag => ({ name: 'article:tag', content: tag })),
      ],
      links: [{ rel: 'canonical', href: url }],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(jsonLd) }],
    }
  },
  component: GuidePage,
})

function GuidePage() {
  const { slug, frontmatter, readingTime, headings, prevNext } = Route.useLoaderData()
  const MdxContent = useMemo(() => guidesCollection.getComponent(slug), [slug])

  return (
    <GuideLayout frontmatter={frontmatter} readingTime={readingTime} headings={headings} prevNext={prevNext}>
      {MdxContent
        ? <MdxContent components={mdxComponents} /> // eslint-disable-line react-hooks/static-components -- stable import.meta.glob reference
        : <NonIdealState icon={<IconAlertCircle size={40} />} title="Failed to load guide" />}
    </GuideLayout>
  )
}
