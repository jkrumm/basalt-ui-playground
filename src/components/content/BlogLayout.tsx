import type { BlogFrontmatter, BlogPost, PrevNext } from '../../lib/content'
import { Alignment, Button, Callout, Classes, Divider, H1, Navbar, NavbarGroup, Tag } from '@blueprintjs/core'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '../ThemeToggle'
import { TableOfContents } from './TableOfContents'

function useReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return progress
}

interface BlogLayoutProps {
  frontmatter: BlogFrontmatter
  currentSlug: string
  readingTime: string
  seriesPosts?: BlogPost[]
  prevNext?: PrevNext
  children: React.ReactNode
}

export function BlogLayout({ frontmatter, currentSlug, readingTime, seriesPosts = [], prevNext, children }: BlogLayoutProps) {
  const progress = useReadingProgress()

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 64 }}>
      {/* Reading progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: 2,
          width: `${progress}%`,
          backgroundColor: '#2D72D2',
          zIndex: 9999,
          transition: 'width 0.05s linear',
          pointerEvents: 'none',
        }}
      />
      <Navbar>
        <NavbarGroup align={Alignment.LEFT}>
          <Link to="/blog" style={{ textDecoration: 'none' }}>
            <Button variant="minimal" icon={<IconArrowLeft size={16} />} text="Blog" />
          </Link>
          <Divider />
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="minimal" text="CBBI" />
          </Link>
        </NavbarGroup>
        <NavbarGroup align={Alignment.RIGHT}>
          <ThemeToggle />
        </NavbarGroup>
      </Navbar>

      <div
        style={{
          display: 'flex',
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 1.25rem',
          gap: '3rem',
        }}
      >
        {/* Main content */}
        <div className="mdx-prose" style={{ flex: 1, minWidth: 0 }}>
          {/* Series navigation */}
          {frontmatter.series && seriesPosts.length > 1 && (
            <Callout style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem', marginTop: 0, fontSize: 13 }}>
                Part of the series:
                {' '}
                <strong>{frontmatter.series}</strong>
              </p>
              <ol style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
                {seriesPosts.map((p, i) => (
                  <li key={p.slug} style={{ fontSize: 13, marginBottom: 2 }}>
                    {p.slug === currentSlug
                      ? (
                          <strong>
                            Part
                            {' '}
                            {i + 1}
                            :
                            {' '}
                            {p.frontmatter.title}
                          </strong>
                        )
                      : (
                          <Link to="/blog/$slug" params={{ slug: p.slug }} style={{ color: 'inherit' }}>
                            Part
                            {' '}
                            {i + 1}
                            :
                            {' '}
                            {p.frontmatter.title}
                          </Link>
                        )}
                  </li>
                ))}
              </ol>
            </Callout>
          )}

          {/* Post header */}
          <header style={{ marginBottom: '2rem', marginTop: '2rem' }}>
            <H1>{frontmatter.title}</H1>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: '#8f99a8', fontSize: 14 }}>
                {new Date(frontmatter.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span style={{ color: '#5f6b7c' }}>·</span>
              <span style={{ color: '#8f99a8', fontSize: 14 }}>{readingTime}</span>
              {frontmatter.updatedAt && (
                <>
                  <span style={{ color: '#5f6b7c' }}>·</span>
                  <span style={{ color: '#5f6b7c', fontSize: 13 }}>
                    Updated
                    {' '}
                    {new Date(frontmatter.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {frontmatter.tags.map(tag => (
                <Tag key={tag} minimal>
                  {tag}
                </Tag>
              ))}
            </div>

            {frontmatter.description && (
              <p style={{ color: '#8f99a8', fontSize: 16, marginTop: '1rem', marginBottom: 0 }}>
                {frontmatter.description}
              </p>
            )}
          </header>

          <div className={`${Classes.RUNNING_TEXT} mdx-content`}>
            {children}
          </div>

          {/* Prev / Next navigation */}
          {prevNext && (prevNext.prev || prevNext.next) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                marginTop: '3rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {prevNext.prev
                ? (
                    <Link to="/blog/$slug" params={{ slug: prevNext.prev.slug }} style={{ textDecoration: 'none', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5f6b7c' }}>
                          <IconArrowLeft size={13} />
                          Previous
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{prevNext.prev.frontmatter.title}</span>
                        {prevNext.prev.frontmatter.tags[0] && (
                          <Tag minimal style={{ fontSize: 11, width: 'fit-content' }}>{prevNext.prev.frontmatter.tags[0]}</Tag>
                        )}
                      </div>
                    </Link>
                  )
                : <div style={{ flex: 1 }} />}

              {prevNext.next && (
                <Link to="/blog/$slug" params={{ slug: prevNext.next.slug }} style={{ textDecoration: 'none', flex: 1, textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5f6b7c' }}>
                      Next
                      <IconArrowRight size={13} />
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{prevNext.next.frontmatter.title}</span>
                    {prevNext.next.frontmatter.tags[0] && (
                      <Tag minimal style={{ fontSize: 11, width: 'fit-content' }}>{prevNext.next.frontmatter.tags[0]}</Tag>
                    )}
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* TOC sidebar — shown via CSS on wide viewports */}
        <aside className="mdx-toc-sidebar" style={{ width: 220, flexShrink: 0, paddingTop: '2rem' }}>
          <TableOfContents />
        </aside>
      </div>
    </div>
  )
}
