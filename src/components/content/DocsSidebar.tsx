import type { DocNavSection } from '../../lib/content'
import { InputGroup } from '@blueprintjs/core'
import { Search } from '@blueprintjs/icons'
import { Box } from '@blueprintjs/labs'
import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { INDEX_SUFFIX_RE } from '../../lib/content'
import styles from './DocsSidebar.module.css'

interface TocItem {
  id: string
  text: string
  depth: number
}

function useInlineToc() {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const content = document.querySelector('.mdx-content')
    if (!content)
      return

    const scan = () => {
      const headings = [...content.querySelectorAll('h2, h3')] as HTMLElement[]
      setItems(
        headings
          .filter(h => h.id)
          .map(h => ({ id: h.id, text: h.textContent ?? '', depth: Number(h.tagName[1]) })),
      )
    }

    scan()
    const mo = new MutationObserver(scan)
    mo.observe(content, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])

  useEffect(() => {
    if (items.length === 0)
      return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            setActiveId(e.target.id)
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    items.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el)
        io.observe(el)
    })
    return () => io.disconnect()
  }, [items])

  return { items, activeId }
}

interface DocsSidebarProps {
  sections: DocNavSection[]
}

export function DocsSidebar({ sections }: DocsSidebarProps) {
  const location = useRouterState({ select: s => s.location.pathname })
  const { items: tocItems, activeId } = useInlineToc()

  return (
    <div>
      {/* Search trigger */}
      <Box
        role="button"
        tabIndex={0}
        onClick={() => window.dispatchEvent(new Event('open-search'))}
        onKeyDown={e => e.key === 'Enter' && window.dispatchEvent(new Event('open-search'))}
        className={styles.searchTrigger}
      >
        <InputGroup
          leftIcon={<Search />}
          placeholder="Search..."
          readOnly
          rightElement={(
            <kbd className={styles.kbdHint}>⌘K</kbd>
          )}
          style={{ pointerEvents: 'none' }}
        />
      </Box>

      {/* Navigation */}
      {sections.map((section, i) => (
        <div key={section.section}>
          {i > 0 && <div className={styles.sectionDivider} />}
          <p className={styles.sectionLabel}>{section.section}</p>
          {section.items.map((item) => {
            const isRoot = item.slug === 'index'
            const cleanSlug = item.slug.replace(INDEX_SUFFIX_RE, '')
            const isActive = isRoot ? location === '/docs' : location === `/docs/${cleanSlug}`

            return (
              <div key={item.slug}>
                {isRoot
                  ? (
                      <Link to="/docs" style={{ textDecoration: 'none' }}>
                        <div className={`${styles.navItem} ${isActive ? styles.navItemActive : styles.navItemInactive}`}>
                          {item.label}
                        </div>
                      </Link>
                    )
                  : (
                      <Link to="/docs/$" params={{ _splat: cleanSlug }} style={{ textDecoration: 'none' }}>
                        <div className={`${styles.navItem} ${isActive ? styles.navItemActive : styles.navItemInactive}`}>
                          {item.label}
                        </div>
                      </Link>
                    )}

                {/* Inline TOC under active page */}
                {isActive && tocItems.length > 0 && (
                  <Box marginY={0.5}>
                    {tocItems.map(toc => (
                      <a
                        key={toc.id}
                        href={`#${toc.id}`}
                        className={`${styles.tocLink} ${toc.id === activeId ? styles.tocLinkActive : styles.tocLinkInactive}`}
                        style={{ paddingLeft: toc.depth === 3 ? 24 : 16, paddingTop: 3, paddingBottom: 3, paddingRight: 8 }}
                      >
                        {toc.text}
                      </a>
                    ))}
                  </Box>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
