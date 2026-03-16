import type { SearchDocument } from '../lib/content'
import {
  Alignment,
  Button,
  Card,
  Classes,
  Divider,
  Elevation,
  H1,
  InputGroup,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Tag,
} from '@blueprintjs/core'
import { Box, Flex } from '@blueprintjs/labs'
import { IconArrowLeft, IconSearch } from '@tabler/icons-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { ThemeToggle } from '../components/ThemeToggle'
import { EVENTS, track } from '../lib/analytics'
import { getSearchIndex, INDEX_SUFFIX_RE } from '../lib/content'
import styles from './search.module.css'

export const Route = createFileRoute('/search')({
  loader: (): SearchDocument[] => getSearchIndex(),
  head: () => ({
    meta: [
      { title: 'Search — CBBI Blueprint' },
      { name: 'description', content: 'Search blog posts and documentation.' },
    ],
    links: [{ rel: 'canonical', href: 'https://cbbi.jkrumm.com/search' }],
  }),
  component: SearchPage,
})

function SearchPage() {
  const documents = Route.useLoaderData()
  const [query, setQuery] = useState('')

  const fuse = useMemo(
    () =>
      new Fuse(documents, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'description', weight: 1 },
          { name: 'tags', weight: 1.5 },
          { name: 'section', weight: 0.5 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [documents],
  )

  const results = useMemo(() => {
    if (!query.trim())
      return []
    return fuse.search(query).slice(0, 12)
  }, [fuse, query])

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Navbar style={{ position: 'sticky', top: 0, zIndex: 20 }}>
          <NavbarGroup align={Alignment.LEFT}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="minimal" icon={<IconArrowLeft size={16} />} text="CBBI" />
            </Link>
            <Divider />
            <NavbarHeading>Search</NavbarHeading>
          </NavbarGroup>
          <NavbarGroup align={Alignment.RIGHT}>
            <ThemeToggle />
          </NavbarGroup>
        </Navbar>

        <Box className={styles.container}>
          <H1 style={{ marginBottom: '1.5rem' }}>Search</H1>

          <InputGroup
            large
            leftIcon={<IconSearch size={16} />}
            placeholder="Search blog posts and docs…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{ marginBottom: '1.5rem' }}
          />

          {query.trim() && results.length === 0 && (
            <p className={Classes.TEXT_MUTED}>
              No results for &ldquo;
              {query}
              &rdquo;
            </p>
          )}

          <Flex flexDirection="column" gap={2}>
            {results.map(({ item }) => (
              <Link
                key={`${item.type}/${item.slug}`}
                to={item.type === 'blog' ? '/blog/$slug' : '/docs/$'}
                params={
                  item.type === 'blog'
                    ? { slug: item.slug }
                    : { _splat: item.slug.replace(INDEX_SUFFIX_RE, '') }
                }
                style={{ textDecoration: 'none' }}
                onClick={() => track(EVENTS.SEARCH_QUERY, { query: query.trim(), result_count: results.length })}
              >
                <Card elevation={Elevation.ONE} interactive style={{ padding: '1rem' }}>
                  <Flex gap={2} alignItems="center" marginBottom={1}>
                    <Tag intent={item.type === 'blog' ? 'primary' : 'success'} minimal>
                      {item.type === 'blog' ? 'Blog' : 'Docs'}
                    </Tag>
                    {item.section && (
                      <>
                        <span className={Classes.TEXT_MUTED}>›</span>
                        <span className={Classes.TEXT_MUTED}>{item.section}</span>
                      </>
                    )}
                  </Flex>
                  <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>{item.title}</p>
                  <p className={Classes.TEXT_MUTED} style={{ margin: 0, lineHeight: 1.4 }}>{item.description}</p>
                  {item.tags && item.tags.length > 0 && (
                    <Flex gap={1} flexWrap="wrap" marginTop={2}>
                      {item.tags.slice(0, 4).map(tag => (
                        <Tag key={tag} minimal>
                          {tag}
                        </Tag>
                      ))}
                    </Flex>
                  )}
                </Card>
              </Link>
            ))}
          </Flex>

          {!query.trim() && (
            <Box marginTop={8}>
              <p className={Classes.TEXT_MUTED}>
                Searching across
                {' '}
                {documents.filter(d => d.type === 'blog').length}
                {' '}
                blog posts and
                {' '}
                {documents.filter(d => d.type === 'docs').length}
                {' '}
                docs pages.
              </p>
            </Box>
          )}
        </Box>
      </Box>
    </PageLayout>
  )
}
