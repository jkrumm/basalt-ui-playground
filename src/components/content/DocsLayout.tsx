import type { DocNavSection } from '../../lib/content'
import { Alignment, Button, Card, Classes, Divider, Elevation, Navbar, NavbarGroup } from '@blueprintjs/core'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { Link, useRouterState } from '@tanstack/react-router'
import { INDEX_SUFFIX_RE } from '../../lib/content'
import { ThemeToggle } from '../ThemeToggle'
import { DocsSidebar } from './DocsSidebar'

interface DocsLayoutProps {
  sections: DocNavSection[]
  children: React.ReactNode
}

export function DocsLayout({ sections, children }: DocsLayoutProps) {
  const pathname = useRouterState({ select: s => s.location.pathname })

  // Derive active section + page label + next page from sections + current pathname
  let sectionTitle: string | null = null
  let pageLabel: string | null = null
  const flat = sections.flatMap(s => s.items)
  let activeIdx = -1
  for (const sec of sections) {
    for (const item of sec.items) {
      const isRoot = item.slug === 'index'
      const cleanSlug = item.slug.replace(INDEX_SUFFIX_RE, '')
      const isActive = isRoot ? pathname === '/docs' : pathname === `/docs/${cleanSlug}`
      if (isActive) {
        sectionTitle = sec.section
        pageLabel = item.label
        activeIdx = flat.indexOf(item)
        break
      }
    }
    if (pageLabel)
      break
  }
  const nextPage = activeIdx !== -1 ? (flat[activeIdx + 1] ?? null) : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar>
        <NavbarGroup align={Alignment.LEFT}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="minimal" icon={<IconArrowLeft size={16} />} text="CBBI" />
          </Link>
          <Divider />
          <Link to="/docs" style={{ textDecoration: 'none' }}>
            <Button variant="minimal" text="Docs" />
          </Link>
          <Link to="/blog" style={{ textDecoration: 'none' }}>
            <Button variant="minimal" text="Blog" />
          </Link>
        </NavbarGroup>
        <NavbarGroup align={Alignment.RIGHT}>
          <ThemeToggle />
        </NavbarGroup>
      </Navbar>

      <div
        style={{
          display: 'flex',
          flex: 1,
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          padding: '0 1rem',
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            paddingTop: '1.5rem',
            paddingRight: '1.5rem',
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <DocsSidebar sections={sections} />
        </aside>

        {/* Content */}
        <main
          className={`${Classes.RUNNING_TEXT} mdx-content`}
          style={{
            flex: 1,
            padding: '2rem 2rem 4rem',
            minWidth: 0,
          }}
        >
          {/* Breadcrumbs */}
          {sectionTitle && pageLabel && (
            <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
              <ol style={{ display: 'flex', gap: 6, alignItems: 'center', listStyle: 'none', margin: 0, padding: 0, fontSize: 13 }}>
                <li>
                  <Link to="/docs" style={{ color: '#8f99a8', textDecoration: 'none' }}>
                    Docs
                  </Link>
                </li>
                <li style={{ color: '#5f6b7c' }}>›</li>
                <li style={{ color: '#8f99a8' }}>{sectionTitle}</li>
                <li style={{ color: '#5f6b7c' }}>›</li>
                <li style={{ color: '#abb3bf' }}>{pageLabel}</li>
              </ol>
            </nav>
          )}
          {children}

          {/* What's next */}
          {nextPage && (() => {
            const isRoot = nextPage.slug === 'index'
            const cleanSlug = nextPage.slug.replace(INDEX_SUFFIX_RE, '')
            return (
              <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5f6b7c', marginBottom: '0.75rem' }}>
                  What&apos;s next
                </p>
                <Link
                  to={isRoot ? '/docs' : '/docs/$'}
                  params={isRoot ? undefined : { _splat: cleanSlug }}
                  style={{ textDecoration: 'none' }}
                >
                  <Card
                    elevation={Elevation.ONE}
                    interactive
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, margin: '0 0 0.2rem', fontSize: 15 }}>{nextPage.label}</p>
                      {nextPage.frontmatter.description && (
                        <p style={{ margin: 0, fontSize: 13, color: '#8f99a8' }}>{nextPage.frontmatter.description}</p>
                      )}
                    </div>
                    <IconArrowRight size={18} style={{ color: '#5f6b7c', flexShrink: 0 }} />
                  </Card>
                </Link>
              </div>
            )
          })()}
        </main>
      </div>
    </div>
  )
}
