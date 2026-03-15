import type { SearchDocument } from '../../lib/content'
import { Card, Classes, Dialog, Elevation, InputGroup, Tag } from '@blueprintjs/core'
import { Link } from '@tanstack/react-router'
import Fuse from 'fuse.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getSearchIndex, INDEX_SUFFIX_RE } from '../../lib/content'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  // Lazy initializer — getSearchIndex reads bundled glob data, safe to call on mount
  const [documents] = useState<SearchDocument[]>(() => getSearchIndex())
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset query and refocus on each open
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks-extra/no-direct-set-state-in-use-effect
      setQuery('')
      return
    }
    // Delay focus to let Blueprint's Dialog animation finish
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [isOpen])

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
    return fuse.search(query).slice(0, 8)
  }, [fuse, query])

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      canOutsideClickClose
      canEscapeKeyClose
      style={{ width: 600, padding: 0, overflow: 'hidden' }}
    >
      <div style={{ padding: '1rem 1rem 0' }}>
        <InputGroup
          inputRef={inputRef}
          large
          leftIcon="search"
          placeholder="Search posts and docs…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          rightElement={(
            <kbd
              style={{
                fontSize: 11,
                color: '#8f99a8',
                backgroundColor: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4,
                padding: '2px 6px',
                margin: '6px 8px 0 0',
                display: 'inline-block',
              }}
            >
              ESC
            </kbd>
          )}
        />
      </div>

      <div
        style={{
          maxHeight: 420,
          overflowY: 'auto',
          padding: '0.5rem 1rem 1rem',
          marginTop: '0.5rem',
        }}
      >
        {query.trim() && results.length === 0 && (
          <p className={Classes.TEXT_MUTED} style={{ fontSize: 13, padding: '0.5rem 0' }}>
            No results for &ldquo;
            {query}
            &rdquo;
          </p>
        )}

        {!query.trim() && (
          <p className={Classes.TEXT_MUTED} style={{ fontSize: 12, padding: '0.25rem 0 0' }}>
            {documents.length > 0
              ? `Searching across ${documents.filter(d => d.type === 'blog').length} blog posts and ${documents.filter(d => d.type === 'docs').length} docs pages`
              : 'Loading…'}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              onClick={onClose}
            >
              <Card elevation={Elevation.ONE} interactive style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: item.type === 'blog' ? '#2d72d2' : '#0d8050',
                    }}
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
                <p style={{ fontWeight: 600, margin: '0 0 0.15rem', fontSize: 14 }}>{item.title}</p>
                <p style={{ color: '#8f99a8', margin: 0, fontSize: 12, lineHeight: 1.4 }}>{item.description}</p>
                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {item.tags.slice(0, 3).map(tag => (
                      <Tag key={tag} minimal style={{ fontSize: 10 }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
