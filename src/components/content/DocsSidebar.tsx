import type { DocNavSection } from '../../lib/content'
import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
import { Link, useRouterState } from '@tanstack/react-router'

const INDEX_SUFFIX_RE = /\/index$/

interface DocsSidebarProps {
  sections: DocNavSection[]
}

function resolveDocHref(slug: string): string {
  // "index" → "/docs", "getting-started/index" → "/docs/getting-started"
  if (slug === 'index')
    return '/docs'
  const clean = slug.replace(INDEX_SUFFIX_RE, '')
  return `/docs/${clean}`
}

export function DocsSidebar({ sections }: DocsSidebarProps) {
  const location = useRouterState({ select: s => s.location.pathname })

  return (
    <Menu style={{ minWidth: 220, padding: '0.5rem 0' }}>
      {sections.map((section, i) => (
        <div key={section.section}>
          {i > 0 && <MenuDivider />}
          <MenuDivider title={section.section} />
          {section.items.map((item) => {
            const href = resolveDocHref(item.slug)
            const isActive = location === href
            return (
              <Link key={item.slug} to={href as never} style={{ textDecoration: 'none' }}>
                <MenuItem
                  text={item.label}
                  active={isActive}
                  style={{ borderRadius: 4 }}
                />
              </Link>
            )
          })}
        </div>
      ))}
    </Menu>
  )
}
