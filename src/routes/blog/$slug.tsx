import type { BlogFrontmatter, BlogModule } from '../../lib/content'
import { NonIdealState, Spinner } from '@blueprintjs/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Suspense, useEffect, useState } from 'react'
import readingTime from 'reading-time'
import { BlogLayout } from '../../components/content/BlogLayout'
import { mdxComponents } from '../../components/mdx/MDXComponents'
import { blogMeta, blogModules } from '../../lib/content'

interface PostLoaderData {
  slug: string
  frontmatter: BlogFrontmatter
  readingTime: string
}

const getBlogPostFn = createServerFn({ method: 'GET' })
  .inputValidator((slug: unknown): string => {
    if (typeof slug !== 'string')
      throw new Error('Invalid slug')
    return slug
  })
  .handler(async ({ data: slug }): Promise<PostLoaderData> => {
    const key = `../content/blog/${slug}.mdx`
    const fm = blogMeta[key]
    if (!fm)
      throw notFound()
    const rawModules = import.meta.glob<string>(
      '../../content/blog/*.mdx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = rawModules[`../../content/blog/${slug}.mdx`] ?? ''
    return { slug, frontmatter: fm, readingTime: readingTime(raw).text }
  })

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => getBlogPostFn({ data: params.slug }),
  head: ({ loaderData: ld }) => ({
    meta: [
      { title: `${ld?.frontmatter.title ?? 'Blog'} — CBBI Blueprint` },
      { name: 'description', content: ld?.frontmatter.description },
      { property: 'og:title', content: ld?.frontmatter.title },
      { property: 'og:type', content: 'article' },
      { name: 'article:published_time', content: ld?.frontmatter.publishedAt },
    ],
  }),
  component: BlogPostPage,
})

// Wrap the component in an object to prevent React treating it as a state updater
interface ContentState {
  Component: React.ComponentType<{ components: typeof mdxComponents }>
}

function useMDXContent(slug: string) {
  const [state, setState] = useState<ContentState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const key = `../content/blog/${slug}.mdx`
    const loader = blogModules[key]
    const load = loader
      ? loader()
      : Promise.reject(new Error(`Post not found: ${slug}`))
    load
      .then((mod: BlogModule) => {
        setState({ Component: mod.default as React.ComponentType<{ components: typeof mdxComponents }> })
      })
      .catch((err: unknown) => {
        setError(String(err))
      })
  }, [slug])

  return { state, error }
}

function BlogPostPage() {
  const loaderData = Route.useLoaderData()
  const { slug, frontmatter, readingTime: rt } = loaderData as PostLoaderData
  const { state, error } = useMDXContent(slug)

  return (
    <BlogLayout frontmatter={frontmatter} readingTime={rt}>
      {error
        ? (
            <NonIdealState
              icon="error"
              title="Failed to load post"
              description={error}
            />
          )
        : !state
            ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                  <Spinner size={40} />
                </div>
              )
            : (
                <Suspense fallback={<Spinner size={40} />}>
                  <state.Component components={mdxComponents} />
                </Suspense>
              )}
    </BlogLayout>
  )
}
