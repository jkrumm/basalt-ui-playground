import type { BlogFrontmatter } from '../../lib/content'
import { Alignment, Button, Classes, Divider, H1, Navbar, NavbarGroup, Tag } from '@blueprintjs/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '../ThemeToggle'

interface BlogLayoutProps {
  frontmatter: BlogFrontmatter
  readingTime: string
  children: React.ReactNode
}

export function BlogLayout({ frontmatter, readingTime, children }: BlogLayoutProps) {
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

      <div className="mdx-prose">
        {/* Post header */}
        <header style={{ marginBottom: '2rem' }}>
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
    </div>
  )
}
