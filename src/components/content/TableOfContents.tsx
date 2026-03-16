import { Classes } from '@blueprintjs/core'
import { useEffect, useState } from 'react'
import styles from './TableOfContents.module.css'

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
    <nav aria-label="Table of contents" className={styles.nav}>
      <p className={styles.heading}>On this page</p>
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <li
              key={item.id}
              className={`${isActive ? styles.itemActive : styles.itemInactive}${item.depth === 3 ? ` ${styles.itemIndented}` : ''}`}
            >
              <a
                href={`#${item.id}`}
                className={`${styles.link} ${isActive ? styles.linkActive : Classes.TEXT_MUTED}`}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
