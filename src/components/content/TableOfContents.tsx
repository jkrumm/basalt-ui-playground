import { Classes } from '@blueprintjs/core'
import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  depth: number
}

interface TableOfContentsProps {
  contentSelector?: string
}

export function TableOfContents({ contentSelector = '.mdx-content' }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // Watch for heading elements appearing in the content container.
  // Using MutationObserver so the TOC populates correctly after lazy MDX resolves
  // (the content div exists immediately but headings are added asynchronously).
  useEffect(() => {
    const content = document.querySelector(contentSelector)
    if (!content)
      return

    const scan = () => {
      const headings = [...content.querySelectorAll('h2, h3')] as HTMLElement[]
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setItems(
        headings
          .filter(h => h.id)
          .map(h => ({ id: h.id, text: h.textContent ?? '', depth: Number(h.tagName[1]) })),
      )
    }

    scan()
    const mutationObserver = new MutationObserver(scan)
    mutationObserver.observe(content, { childList: true, subtree: true })
    return () => mutationObserver.disconnect()
  }, [contentSelector])

  useEffect(() => {
    if (items.length === 0)
      return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setActiveId(entry.target.id)
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    items.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el)
        observer.observe(el)
    })
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0)
    return null

  return (
    <nav
      aria-label="Table of contents"
      style={{
        position: 'sticky',
        top: '4rem',
        maxHeight: 'calc(100vh - 6rem)',
        overflowY: 'auto',
        paddingBottom: '2rem',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
          marginTop: 0,
          color: '#5f6b7c',
        }}
      >
        On this page
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ paddingLeft: item.depth === 3 ? 12 : 0 }}>
            <a
              href={`#${item.id}`}
              className={item.id === activeId ? undefined : Classes.TEXT_MUTED}
              style={{
                display: 'block',
                fontSize: 13,
                lineHeight: 1.4,
                padding: '3px 0',
                textDecoration: 'none',
                color: item.id === activeId ? `var(--${Classes.INTENT_PRIMARY})` : undefined,
                fontWeight: item.id === activeId ? 500 : undefined,
                transition: 'color 0.15s',
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
