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
import { IconArrowLeft } from '@tabler/icons-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import { ThemeToggle } from '../components/ThemeToggle'
import { getSearchIndex, INDEX_SUFFIX_RE } from '../lib/content'

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
    <div style={{ minHeight: '100vh', paddingBottom: 64 }}>
      <Navbar>
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

      <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1.25rem' }}>
        <H1 style={{ marginBottom: '1.5rem' }}>Search</H1>

        <InputGroup
          large
          leftIcon="search"
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

        <div className="search-results">
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
            >
              <Card elevation={Elevation.ONE} interactive style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span
                    className="search-result-type"
                    style={{ color: item.type === 'blog' ? '#2d72d2' : '#0d8050' }}
                  >
                    {item.type === 'blog' ? 'Blog' : 'Docs'}
                  </span>
                  {item.section && (
                    <>
                      <span style={{ color: '#5f6b7c', fontSize: 11 }}>›</span>
                      <span style={{ color: '#5f6b7c', fontSize: 11 }}>{item.section}</span>
                    </>
                  )}
                </div>
                <p style={{ fontWeight: 600, margin: '0 0 0.25rem', fontSize: 15 }}>{item.title}</p>
                <p style={{ color: '#8f99a8', margin: 0, fontSize: 13, lineHeight: 1.4 }}>{item.description}</p>
                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {item.tags.slice(0, 4).map(tag => (
                      <Tag key={tag} minimal style={{ fontSize: 11 }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>

        {!query.trim() && (
          <div style={{ marginTop: '2rem' }}>
            <p className={Classes.TEXT_MUTED} style={{ fontSize: 13 }}>
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
          </div>
        )}
      </div>
    </div>
  )
}
