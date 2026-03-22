import type { HeadingItem } from '../../lib/collection'
import type { BlockFrontmatter } from '../../lib/content'
import {
  Alignment,
  Button,
  Classes,
  Divider,
  H1,
  Navbar,
  NavbarGroup,
  Tag,
} from '@blueprintjs/core'
import { Box, Flex } from '@blueprintjs/labs'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { PageLayout } from '../layout/PageLayout'
import { ThemeToggle } from '../ThemeToggle'
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
        <Navbar style={{ position: 'sticky', top: 0, zIndex: 20 }}>
          <NavbarGroup align={Alignment.LEFT}>
            <Link to="/blocks" search={{ category: '' }} className={styles.navLink}>
              <Button variant="minimal" icon={<IconArrowLeft size={16} />} text="Blocks" />
            </Link>
            <Divider />
            <Link to="/docs" className={styles.navLink}>
              <Button variant="minimal" text="Docs" />
            </Link>
            <Link to="/guides" search={{ category: '', difficulty: '' }} className={styles.navLink}>
              <Button variant="minimal" text="Guides" />
            </Link>
          </NavbarGroup>
          <NavbarGroup align={Alignment.RIGHT}>
            <ThemeToggle />
          </NavbarGroup>
        </Navbar>

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
