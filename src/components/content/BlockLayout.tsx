import type { HeadingItem } from '../../lib/collection'
import type { BlockFrontmatter } from '../../lib/content'
import { Classes, H1, Tag } from '@blueprintjs/core'
import { Box, Flex } from '@blueprintjs/labs'
import { ContentNav } from '../layout/ContentNav'
import { PageLayout } from '../layout/PageLayout'
import styles from './BlockLayout.module.css'
import { TableOfContents } from './TableOfContents'

interface BlockLayoutProps {
  frontmatter: BlockFrontmatter
  headings: HeadingItem[]
  children: React.ReactNode
}

export function BlockLayout({ frontmatter, headings, children }: BlockLayoutProps) {
  return (
    <PageLayout>
      <Box className={styles.page}>
        <ContentNav />

        <div className={styles.layout}>
          <div className={`mdx-prose ${styles.content}`}>
            <Box marginBottom={8} marginTop={8}>
              <Flex gap={2} flexWrap="wrap" marginBottom={3} alignItems="center">
                <Tag intent="primary">{frontmatter.category}</Tag>
                {frontmatter.tags.map(tag => (
                  <Tag key={tag} minimal>{tag}</Tag>
                ))}
              </Flex>

              <H1>{frontmatter.title}</H1>

              <p className={`${Classes.TEXT_MUTED} ${Classes.TEXT_LARGE}`} style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                {frontmatter.description}
              </p>
            </Box>

            <div className={`${Classes.RUNNING_TEXT} mdx-content`}>
              {children}
            </div>
          </div>

          <aside className={styles.toc}>
            <TableOfContents headings={headings} />
          </aside>
        </div>
      </Box>
    </PageLayout>
  )
}
