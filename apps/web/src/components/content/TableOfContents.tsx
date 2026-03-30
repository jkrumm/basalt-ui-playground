import type { HeadingItem } from "../../lib/content";
import { Classes } from "@blueprintjs/core";
import { useEffect, useState } from "react";
import styles from "./TableOfContents.module.css";

interface TableOfContentsProps {
  headings: HeadingItem[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className={styles.nav}>
      <p className={styles.heading}>On this page</p>
      <ul className={styles.list}>
        {headings.map((item) => {
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
