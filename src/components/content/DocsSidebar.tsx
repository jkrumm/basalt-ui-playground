import type { DocNavSection } from '../../lib/content'
import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
import { Link, useRouterState } from '@tanstack/react-router'
import { INDEX_SUFFIX_RE } from '../../lib/content'

interface DocsSidebarProps {
  sections: DocNavSection[]
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
            const isRoot = item.slug === 'index'
            const cleanSlug = item.slug.replace(INDEX_SUFFIX_RE, '')
            const isActive = isRoot ? location === '/docs' : location === `/docs/${cleanSlug}`

            return isRoot
              ? (
                  <Link key={item.slug} to="/docs" style={{ textDecoration: 'none' }}>
                    <MenuItem text={item.label} active={isActive} style={{ borderRadius: 4 }} />
                  </Link>
                )
              : (
                  <Link key={item.slug} to="/docs/$" params={{ _splat: cleanSlug }} style={{ textDecoration: 'none' }}>
                    <MenuItem text={item.label} active={isActive} style={{ borderRadius: 4 }} />
                  </Link>
                )
          })}
        </div>
      ))}
    </Menu>
  )
}
