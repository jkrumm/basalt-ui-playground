import type { HeadingItem } from '../../lib/collection'
import type { BlogFrontmatter, BlogPost, PrevNext } from '../../lib/content'
import { NonIdealState } from '@blueprintjs/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMemo } from 'react'
import { BlogLayout } from '../../components/content/BlogLayout'
import { RelatedPosts } from '../../components/content/RelatedPosts'
import { mdxComponents } from '../../components/mdx/MDXComponents'
import { blogCollection, getBlogList, getPrevNextPosts, getRelatedPosts, getSeriesPosts } from '../../lib/content'

const BASE_URL = 'https://cbbi.jkrumm.com'

interface PostLoaderData {
  slug: string
  frontmatter: BlogFrontmatter
  readingTime: string
  headings: HeadingItem[]
  related: BlogPost[]
  seriesPosts: BlogPost[]
  prevNext: PrevNext
}

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }): PostLoaderData => {
    const { slug } = params
    if (!blogCollection.meta[`../content/blog/${slug}.mdx`])
      throw notFound()

    const fm = blogCollection.getBySlug(slug)
    const post = getBlogList().find(p => p.slug === slug)

    return {
      slug,
      frontmatter: fm,
      readingTime: post?.readingTime ?? '1 min read',
      headings: blogCollection.getHeadings(slug),
      related: getRelatedPosts(slug),
      seriesPosts: fm.series ? getSeriesPosts(fm.series) : [],
      prevNext: getPrevNextPosts(slug),
    }
  },
  head: ({ loaderData: ld }) => {
    if (!ld)
      return {}
    const fm = ld.frontmatter
    const url = `${BASE_URL}/blog/${ld.slug}`
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': fm.title,
      'description': fm.description,
      'datePublished': fm.publishedAt,
      'dateModified': fm.updatedAt ?? fm.publishedAt,
      'author': { '@type': 'Person', 'name': fm.author },
      ...(fm.image ? { image: fm.image.startsWith('http') ? fm.image : `${BASE_URL}${fm.image}` } : {}),
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
        ...(fm.image ? [{ property: 'og:image', content: fm.image.startsWith('http') ? fm.image : `${BASE_URL}${fm.image}` }] : []),
        { name: 'article:published_time', content: fm.publishedAt },
        ...(fm.updatedAt ? [{ name: 'article:modified_time', content: fm.updatedAt }] : []),
        ...fm.tags.map(tag => ({ name: 'article:tag', content: tag })),
      ],
      links: [{ rel: 'canonical', href: url }],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(jsonLd) }],
    }
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const { slug, frontmatter, readingTime: rt, headings, related, seriesPosts, prevNext } = Route.useLoaderData()
  const MdxContent = useMemo(() => blogCollection.getComponent(slug), [slug])

  return (
    <BlogLayout frontmatter={frontmatter} readingTime={rt} headings={headings} seriesPosts={seriesPosts} currentSlug={slug} prevNext={prevNext}>
      {MdxContent
        ? <MdxContent components={mdxComponents} /> // eslint-disable-line react-hooks/static-components -- stable import.meta.glob reference
        : <NonIdealState icon={<IconAlertCircle size={40} />} title="Failed to load post" />}
      {related.length > 0 && <RelatedPosts posts={related} />}
    </BlogLayout>
  )
}
