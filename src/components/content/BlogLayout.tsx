import type { BlogFrontmatter, BlogPost } from '../../lib/content'
import { Alignment, Button, Callout, Classes, Divider, H1, Navbar, NavbarGroup, Tag } from '@blueprintjs/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '../ThemeToggle'
import { TableOfContents } from './TableOfContents'

interface BlogLayoutProps {
  frontmatter: BlogFrontmatter
  currentSlug: string
  readingTime: string
  seriesPosts?: BlogPost[]
  children: React.ReactNode
}

export function BlogLayout({ frontmatter, currentSlug, readingTime, seriesPosts = [], children }: BlogLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 64 }}>
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
          alignItems: 'flex-start',
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
        </div>

        {/* TOC sidebar — shown via CSS on wide viewports */}
        <aside className="mdx-toc-sidebar" style={{ width: 220, flexShrink: 0, paddingTop: '2rem' }}>
          <TableOfContents />
        </aside>
      </div>
    </div>
  )
}
