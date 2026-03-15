import type { DocsFrontmatter, DocsModule } from '../../lib/content'
import { NonIdealState, Spinner } from '@blueprintjs/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Suspense, useEffect, useState } from 'react'
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
  head: ({ loaderData: ld }) => ({
    meta: [
      { title: `${(ld as DocsPageData).frontmatter.title} — CBBI Blueprint` },
      { name: 'description', content: (ld as DocsPageData).frontmatter.description },
    ],
  }),
  component: DocsPage,
})

interface ContentState {
  Component: React.ComponentType<{ components: typeof mdxComponents }>
}

function useDocsContent(moduleKey: string) {
  const [state, setState] = useState<ContentState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loader = docsModules[moduleKey]
    const load = loader
      ? loader()
      : Promise.reject(new Error(`Doc page not found: ${moduleKey}`))
    load
      .then((mod: DocsModule) => {
        setState({ Component: mod.default as React.ComponentType<{ components: typeof mdxComponents }> })
      })
      .catch((err: unknown) => setError(String(err)))
  }, [moduleKey])

  return { state, error }
}

function DocsPage() {
  const loaderData = Route.useLoaderData() as DocsPageData
  const { moduleKey, sections } = loaderData
  const { state, error } = useDocsContent(moduleKey)

  return (
    <DocsLayout sections={sections}>
      {error
        ? (
            <NonIdealState icon="error" title="Failed to load page" description={error} />
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
    </DocsLayout>
  )
}
