import type { GuideFrontmatter, GuideItem, HeadingItem } from "../../lib/content";
import { Callout, Card, Classes, Elevation, H1, Tag } from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { IconArrowLeft, IconArrowRight, IconClock } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useReadingProgress } from "../../hooks/useReadingProgress";
import { PageLayout } from "../layout/PageLayout";
import styles from "./GuideLayout.module.css";
import { TableOfContents } from "./TableOfContents";

const DIFFICULTY_INTENTS = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
} as const;

interface GuideLayoutProps {
  frontmatter: GuideFrontmatter;
  readingTime: string;
  headings?: HeadingItem[];
  prevNext?: { prev: GuideItem | null; next: GuideItem | null };
  children: React.ReactNode;
}

export function GuideLayout({
  frontmatter,
  readingTime,
  headings = [],
  prevNext,
  children,
}: GuideLayoutProps) {
  const progress = useReadingProgress();
  const diffIntent = DIFFICULTY_INTENTS[frontmatter.difficulty] ?? "none";
  const hasPrerequisites = (frontmatter.prerequisites?.length ?? 0) > 0;

  return (
    <PageLayout>
      <Box className={styles.page}>
        {/* Reading progress bar */}
        <div className={styles.readingBar} style={{ width: `${progress}%` }} />

        <div className={styles.layout}>
          {/* Main content */}
          <div className={`mdx-prose ${styles.content}`}>
            {/* Prerequisites callout */}
            {hasPrerequisites && (
              <Callout intent="primary" style={{ marginBottom: "1.5rem", marginTop: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem", marginTop: 0 }}>
                  Prerequisites
                </p>
                <p style={{ margin: 0 }}>
                  Before reading this guide, it helps to be familiar with:
                </p>
                <ul style={{ margin: "0.5rem 0 0", padding: "0 0 0 1.25rem" }}>
                  {frontmatter.prerequisites!.map((prereq) => (
                    <li key={prereq}>
                      <Link
                        to="/guides/$slug"
                        params={{ slug: prereq }}
                        style={{ color: "inherit" }}
                      >
                        {prereq.replaceAll("-", " ")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Callout>
            )}

            {/* Guide header */}
            <Box marginBottom={8} marginTop={8}>
              <H1>{frontmatter.title}</H1>

              <Flex gap={2} flexWrap="wrap" alignItems="center" marginBottom={3}>
                <Tag intent={diffIntent}>{frontmatter.difficulty}</Tag>
                {frontmatter.estimatedTime && (
                  <Flex gap={1} alignItems="center">
                    <IconClock size={13} className={Classes.TEXT_MUTED} />
                    <span className={Classes.TEXT_MUTED}>{frontmatter.estimatedTime}</span>
                  </Flex>
                )}
                <span className={Classes.TEXT_MUTED}>·</span>
                <span className={Classes.TEXT_MUTED}>{readingTime}</span>
              </Flex>

              <Flex gap={2} flexWrap="wrap" marginBottom={3}>
                <Tag minimal>{frontmatter.category}</Tag>
                {frontmatter.tags.map((tag) => (
                  <Tag key={tag} minimal>
                    {tag}
                  </Tag>
                ))}
              </Flex>

              <p
                className={`${Classes.TEXT_MUTED} ${Classes.TEXT_LARGE}`}
                style={{ marginTop: "0.75rem", marginBottom: 0 }}
              >
                {frontmatter.description}
              </p>
            </Box>

            <div className={`${Classes.RUNNING_TEXT} mdx-content`}>{children}</div>

            {/* Prev / Next navigation */}
            {prevNext && (prevNext.prev || prevNext.next) && (
              <Flex justifyContent="space-between" gap={4} className={styles.prevNextNav}>
                {prevNext.prev ? (
                  <Link
                    to="/guides/$slug"
                    params={{ slug: prevNext.prev.slug }}
                    className={`${styles.navLink} ${styles.content}`}
                  >
                    <Card elevation={Elevation.ONE} interactive style={{ height: "100%" }}>
                      <Flex alignItems="center" gap={3} padding={3}>
                        <IconArrowLeft
                          size={16}
                          className={Classes.TEXT_MUTED}
                          style={{ flexShrink: 0 }}
                        />
                        <Box>
                          <p className={styles.prevLabel}>Previous</p>
                          <p className={styles.prevTitle}>{prevNext.prev.title}</p>
                          <Tag
                            minimal
                            intent={DIFFICULTY_INTENTS[prevNext.prev.difficulty] ?? "none"}
                          >
                            {prevNext.prev.difficulty}
                          </Tag>
                        </Box>
                      </Flex>
                    </Card>
                  </Link>
                ) : (
                  <Box flex="1" />
                )}

                {prevNext.next && (
                  <Link
                    to="/guides/$slug"
                    params={{ slug: prevNext.next.slug }}
                    className={`${styles.navLink} ${styles.content}`}
                  >
                    <Card elevation={Elevation.ONE} interactive style={{ height: "100%" }}>
                      <Flex justifyContent="end" alignItems="center" gap={3} padding={3}>
                        <Box style={{ textAlign: "right" }}>
                          <p className={styles.nextLabel}>Next</p>
                          <p className={styles.nextTitle}>{prevNext.next.title}</p>
                          <Tag
                            minimal
                            intent={DIFFICULTY_INTENTS[prevNext.next.difficulty] ?? "none"}
                          >
                            {prevNext.next.difficulty}
                          </Tag>
                        </Box>
                        <IconArrowRight
                          size={16}
                          className={Classes.TEXT_MUTED}
                          style={{ flexShrink: 0 }}
                        />
                      </Flex>
                    </Card>
                  </Link>
                )}
              </Flex>
            )}
          </div>

          {/* TOC sidebar */}
          <aside className={styles.toc}>
            <TableOfContents headings={headings} />
          </aside>
        </div>
      </Box>
    </PageLayout>
  );
}
