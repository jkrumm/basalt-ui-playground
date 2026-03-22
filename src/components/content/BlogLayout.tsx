import type { HeadingItem } from '../../lib/collection'
import type { BlogFrontmatter, BlogPost, PrevNext } from '../../lib/content'
import { Alignment, Button, Callout, Card, Classes, Divider, Elevation, H1, Navbar, NavbarGroup, Tag } from '@blueprintjs/core'
import { Box, Flex } from '@blueprintjs/labs'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useReadingProgress } from '../../hooks/useReadingProgress'
import { PageLayout } from '../layout/PageLayout'
import { ThemeToggle } from '../ThemeToggle'
import styles from './BlogLayout.module.css'
import { TableOfContents } from './TableOfContents'

interface BlogLayoutProps {
  frontmatter: BlogFrontmatter
  currentSlug: string
  readingTime: string
  headings?: HeadingItem[]
  seriesPosts?: BlogPost[]
  prevNext?: PrevNext
  children: React.ReactNode
}

export function BlogLayout({ frontmatter, currentSlug, readingTime, headings = [], seriesPosts = [], prevNext, children }: BlogLayoutProps) {
  const progress = useReadingProgress()

  return (
    <PageLayout>
      <Box className={styles.page}>
        {/* Reading progress bar */}
        <div className={styles.readingBar} style={{ width: `${progress}%` }} />

        <Navbar style={{ position: 'sticky', top: 0, zIndex: 20 }}>
          <NavbarGroup align={Alignment.LEFT}>
            <Link to="/blog" search={{ tag: '' }} className={styles.navLink}>
              <Button variant="minimal" icon={<IconArrowLeft size={16} />} text="Blog" />
            </Link>
            <Divider />
            <Link to="/" className={styles.navLink}>
              <Button variant="minimal" text="CBBI" />
            </Link>
          </NavbarGroup>
          <NavbarGroup align={Alignment.RIGHT}>
            <ThemeToggle />
          </NavbarGroup>
        </Navbar>

        <div className={styles.layout}>
          {/* Main content */}
          <div className={`mdx-prose ${styles.content}`}>
            {/* Series navigation */}
            {frontmatter.series && seriesPosts.length > 1 && (
              <Callout style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem', marginTop: 0 }}>
                  Part of the series:
                  {' '}
                  <strong>{frontmatter.series}</strong>
                </p>
                <ol style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
                  {seriesPosts.map((p, i) => (
                    <li key={p.slug} style={{ marginBottom: 2 }}>
                      {p.slug === currentSlug
                        ? (
                            <strong>
                              Part
                              {' '}
                              {i + 1}
                              :
                              {' '}
                              {p.frontmatter.title}
                            </strong>
                          )
                        : (
                            <Link to="/blog/$slug" params={{ slug: p.slug }} style={{ color: 'inherit' }}>
                              Part
                              {' '}
                              {i + 1}
                              :
                              {' '}
                              {p.frontmatter.title}
                            </Link>
                          )}
                    </li>
                  ))}
                </ol>
              </Callout>
            )}

            {/* Post header */}
            <Box marginBottom={8} marginTop={8}>
              <H1>{frontmatter.title}</H1>

              <Flex gap={2} flexWrap="wrap" alignItems="center" marginBottom={3}>
                <span className={Classes.TEXT_MUTED}>
                  {new Date(frontmatter.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className={Classes.TEXT_MUTED}>·</span>
                <span className={Classes.TEXT_MUTED}>{readingTime}</span>
                {frontmatter.updatedAt && (
                  <>
                    <span className={Classes.TEXT_MUTED}>·</span>
                    <span className={Classes.TEXT_MUTED}>
                      Updated
                      {' '}
                      {new Date(frontmatter.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </Flex>

              <Flex gap={2} flexWrap="wrap">
                {frontmatter.tags.map(tag => (
                  <Link key={tag} to="/blog" search={{ tag }} style={{ textDecoration: 'none' }}>
                    <Tag minimal interactive>{tag}</Tag>
                  </Link>
                ))}
              </Flex>

              {frontmatter.description && (
                <p className={`${Classes.TEXT_MUTED} ${Classes.TEXT_LARGE}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                  {frontmatter.description}
                </p>
              )}
            </Box>

            <div className={`${Classes.RUNNING_TEXT} mdx-content`}>
              {children}
            </div>

            {/* Prev / Next navigation */}
            {prevNext && (prevNext.prev || prevNext.next) && (
              <Flex justifyContent="space-between" gap={4} className={styles.prevNextNav}>
                {prevNext.prev
                  ? (
                      <Link to="/blog/$slug" params={{ slug: prevNext.prev.slug }} className={`${styles.navLink} ${styles.content}`}>
                        <Card elevation={Elevation.ONE} interactive style={{ height: '100%' }}>
                          <Flex alignItems="center" gap={3} padding={3}>
                            <IconArrowLeft size={16} className={Classes.TEXT_MUTED} style={{ flexShrink: 0 }} />
                            <Box>
                              <p className={styles.prevLabel}>Previous</p>
                              <p className={styles.prevTitle}>{prevNext.prev.frontmatter.title}</p>
                              {prevNext.prev.frontmatter.tags[0] && (
                                <Tag minimal>{prevNext.prev.frontmatter.tags[0]}</Tag>
                              )}
                            </Box>
                          </Flex>
                        </Card>
                      </Link>
                    )
                  : <Box flex="1" />}

                {prevNext.next && (
                  <Link to="/blog/$slug" params={{ slug: prevNext.next.slug }} className={`${styles.navLink} ${styles.content}`}>
                    <Card elevation={Elevation.ONE} interactive style={{ height: '100%' }}>
                      <Flex justifyContent="end" alignItems="center" gap={3} padding={3}>
                        <Box style={{ textAlign: 'right' }}>
                          <p className={styles.nextLabel}>Next</p>
                          <p className={styles.nextTitle}>{prevNext.next.frontmatter.title}</p>
                          {prevNext.next.frontmatter.tags[0] && (
                            <Tag minimal>{prevNext.next.frontmatter.tags[0]}</Tag>
                          )}
                        </Box>
                        <IconArrowRight size={16} className={Classes.TEXT_MUTED} style={{ flexShrink: 0 }} />
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
  )
}
