import type { DocNavSection } from "../../lib/content.ts";
import { InputGroup } from "@blueprintjs/core";
import { Search } from "@blueprintjs/icons";
import { Box } from "@blueprintjs/labs";
import { Link, useRouterState } from "@tanstack/react-router";
import { INDEX_SUFFIX_RE } from "../../lib/content.ts";
import styles from "./DocsSidebar.module.css";

interface DocsSidebarProps {
  sections: DocNavSection[];
}

export function DocsSidebar({ sections }: DocsSidebarProps) {
  const location = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div>
      {/* Search trigger */}
      <Box
        role="button"
        tabIndex={0}
        onClick={() => window.dispatchEvent(new Event("open-search"))}
        onKeyDown={(e) => e.key === "Enter" && window.dispatchEvent(new Event("open-search"))}
        className={styles.searchTrigger}
      >
        <InputGroup
          id="docs-search-trigger"
          leftIcon={<Search />}
          placeholder="Search..."
          readOnly
          rightElement={<kbd className={styles.kbdHint}>⌘K</kbd>}
          style={{ pointerEvents: "none" }}
        />
      </Box>

      {/* Navigation */}
      {sections.map((section, i) => (
        <div key={section.section}>
          {i > 0 && <div className={styles.sectionDivider} />}
          <p className={styles.sectionLabel}>{section.section}</p>
          {section.items.map((item) => {
            const isRoot = item.slug === "index";
            const cleanSlug = item.slug.replace(INDEX_SUFFIX_RE, "");
            const isActive = isRoot ? location === "/docs" : location === `/docs/${cleanSlug}`;

            return (
              <div key={item.slug}>
                {isRoot ? (
                  <Link to="/docs" style={{ textDecoration: "none" }}>
                    <div
                      className={`${styles.navItem} ${isActive ? styles.navItemActive : styles.navItemInactive}`}
                    >
                      {item.label}
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/docs/$"
                    params={{ _splat: cleanSlug }}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className={`${styles.navItem} ${isActive ? styles.navItemActive : styles.navItemInactive}`}
                    >
                      {item.label}
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
