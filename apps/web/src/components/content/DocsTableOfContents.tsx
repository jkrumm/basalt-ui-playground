import { Classes } from "@blueprintjs/core";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import styles from "./TableOfContents.module.css";

interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export function DocsTableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Re-run on every route change so the observer always targets the current
  // .mdx-content element (it gets replaced when navigating between route types).
  useEffect(() => {
    const scan = () => {
      const content = document.querySelector(".mdx-content");
      if (!content) return;
      const headings = [...content.querySelectorAll("h2, h3")] as HTMLElement[];
      setItems(
        headings
          .filter((h) => h.id)
          .map((h) => ({ id: h.id, text: h.textContent ?? "", depth: Number(h.tagName[1]) })),
      );
    };

    scan();
    const content = document.querySelector(".mdx-content");
    if (!content) return;
    const mo = new MutationObserver(scan);
    mo.observe(content, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [pathname]);

  useEffect(() => {
    setActiveId("");
    if (items.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className={styles.nav}>
      <p className={styles.heading}>On this page</p>
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li
              key={item.id}
              className={`${isActive ? styles.itemActive : styles.itemInactive}${item.depth === 3 ? ` ${styles.itemIndented}` : ""}`}
            >
              <a
                href={`#${item.id}`}
                className={`${styles.link} ${isActive ? styles.linkActive : Classes.TEXT_MUTED}`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
