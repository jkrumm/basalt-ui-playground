import type { HeadingItem } from "../../lib/content";
import type { DocNavSection } from "../../lib/content";
import { Card, Classes, Elevation } from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useReadingProgress } from "../../hooks/useReadingProgress";
import { INDEX_SUFFIX_RE } from "../../lib/content";
import { PageLayout } from "../layout/PageLayout";
import styles from "./DocsLayout.module.css";
import { DocsSidebar } from "./DocsSidebar";
import { TableOfContents } from "./TableOfContents";

interface DocsLayoutProps {
  sections: DocNavSection[];
  headings?: HeadingItem[];
  children: React.ReactNode;
}

export function DocsLayout({ sections, headings = [], children }: DocsLayoutProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const progress = useReadingProgress();

  // Derive active section + page label + prev/next from sections + current pathname
  let sectionTitle: string | null = null;
  let pageLabel: string | null = null;
  const flat = sections.flatMap((s) => s.items);
  let activeIdx = -1;
  for (const sec of sections) {
    for (const item of sec.items) {
      const isRoot = item.slug === "index";
      const cleanSlug = item.slug.replace(INDEX_SUFFIX_RE, "");
      const isActive = isRoot ? pathname === "/docs" : pathname === `/docs/${cleanSlug}`;
      if (isActive) {
        sectionTitle = sec.section;
        pageLabel = item.label;
        activeIdx = flat.indexOf(item);
        break;
      }
    }
    if (pageLabel) break;
  }
  const prevPage = activeIdx > 0 ? (flat[activeIdx - 1] ?? null) : null;
  const nextPage = activeIdx !== -1 ? (flat[activeIdx + 1] ?? null) : null;

  return (
    <PageLayout>
      <Box className={styles.page}>
        {/* Reading progress bar */}
        <div className={styles.readingBar} style={{ width: `${progress}%` }} />

        <div className={styles.body}>
          {/* Sidebar — sticky with own scroll */}
          <aside className={styles.sidebar}>
            <DocsSidebar sections={sections} />
          </aside>

          {/* Content */}
          <main className={`${Classes.RUNNING_TEXT} mdx-content ${styles.main}`}>
            {/* Breadcrumbs */}
            {sectionTitle && pageLabel && (
              <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
                <Flex asChild gap={2} alignItems="center" className={styles.breadcrumbList}>
                  <ol>
                    <li>
                      <Link
                        to="/docs"
                        className={Classes.TEXT_MUTED}
                        style={{ textDecoration: "none" }}
                      >
                        Docs
                      </Link>
                    </li>
                    <li className={Classes.TEXT_MUTED}>›</li>
                    <li className={Classes.TEXT_MUTED}>{sectionTitle}</li>
                    <li className={Classes.TEXT_MUTED}>›</li>
                    <li className={Classes.TEXT_DISABLED}>{pageLabel}</li>
                  </ol>
                </Flex>
              </nav>
            )}
            {children}

            {/* Prev / Next navigation */}
            {(prevPage || nextPage) && (
              <Flex justifyContent="space-between" gap={4} className={styles.prevNextNav}>
                {prevPage ? (
                  (() => {
                    const isRoot = prevPage.slug === "index";
                    const cleanSlug = prevPage.slug.replace(INDEX_SUFFIX_RE, "");
                    return (
                      <Link
                        to={isRoot ? "/docs" : "/docs/$"}
                        params={isRoot ? undefined : { _splat: cleanSlug }}
                        className={`${styles.navLink}`}
                        style={{ flex: 1 }}
                      >
                        <Card elevation={Elevation.ONE} interactive style={{ height: "100%" }}>
                          <Flex alignItems="center" gap={3} padding={3}>
                            <IconArrowLeft
                              size={16}
                              className={Classes.TEXT_MUTED}
                              style={{ flexShrink: 0 }}
                            />
                            <Box>
                              <p className={styles.navCardLabel}>Previous</p>
                              <p className={styles.navCardTitle}>{prevPage.label}</p>
                            </Box>
                          </Flex>
                        </Card>
                      </Link>
                    );
                  })()
                ) : (
                  <Box flex="1" />
                )}

                {nextPage &&
                  (() => {
                    const isRoot = nextPage.slug === "index";
                    const cleanSlug = nextPage.slug.replace(INDEX_SUFFIX_RE, "");
                    return (
                      <Link
                        to={isRoot ? "/docs" : "/docs/$"}
                        params={isRoot ? undefined : { _splat: cleanSlug }}
                        className={styles.navLink}
                        style={{ flex: 1 }}
                      >
                        <Card elevation={Elevation.ONE} interactive style={{ height: "100%" }}>
                          <Flex justifyContent="end" alignItems="center" gap={3} padding={3}>
                            <Box style={{ textAlign: "right" }}>
                              <p className={styles.navCardLabel}>Next</p>
                              <p className={styles.navCardTitle}>{nextPage.label}</p>
                            </Box>
                            <IconArrowRight
                              size={16}
                              className={Classes.TEXT_MUTED}
                              style={{ flexShrink: 0 }}
                            />
                          </Flex>
                        </Card>
                      </Link>
                    );
                  })()}
              </Flex>
            )}
          </main>

          {/* TOC — right rail, only when headings exist */}
          {headings.length > 0 && (
            <aside className={styles.toc}>
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>
      </Box>
    </PageLayout>
  );
}
