import type { DocsFrontmatter, DocsModule } from '../../lib/content'
import { NonIdealState, Spinner } from '@blueprintjs/core'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Suspense, useEffect, useState } from 'react'
import { DocsLayout } from '../../components/content/DocsLayout'
import { mdxComponents } from '../../components/mdx/MDXComponents'
import { docsMeta, docsModules, getDocsSidebar } from '../../lib/content'

interface DocsIndexData {
  frontmatter: DocsFrontmatter
  sections: ReturnType<typeof getDocsSidebar>
}

const getDocsIndexFn = createServerFn({ method: 'GET' }).handler((): DocsIndexData => {
  const key = '../content/docs/index.mdx'
  const fm = docsMeta[key]
  if (!fm)
    throw new Error('Docs index not found')
  return { frontmatter: fm, sections: getDocsSidebar() }
})

export const Route = createFileRoute('/docs/')({
  loader: () => getDocsIndexFn(),
  head: ({ loaderData: ld }) => ({
    meta: [
      { title: `${(ld as DocsIndexData).frontmatter.title} — CBBI Blueprint` },
      { name: 'description', content: (ld as DocsIndexData).frontmatter.description },
    ],
  }),
  component: DocsIndexPage,
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

function DocsIndexPage() {
  const loaderData = Route.useLoaderData() as DocsIndexData
  const { sections } = loaderData
  const { state, error } = useDocsContent('../content/docs/index.mdx')

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
