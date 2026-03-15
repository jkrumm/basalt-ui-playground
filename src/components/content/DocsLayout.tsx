import type { DocNavSection } from '../../lib/content'
import { Alignment, Button, Classes, Divider, Navbar, NavbarGroup } from '@blueprintjs/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '../ThemeToggle'
import { DocsSidebar } from './DocsSidebar'

interface DocsLayoutProps {
  sections: DocNavSection[]
  children: React.ReactNode
}

export function DocsLayout({ sections, children }: DocsLayoutProps) {
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
          {children}
        </main>
      </div>
    </div>
  )
}
