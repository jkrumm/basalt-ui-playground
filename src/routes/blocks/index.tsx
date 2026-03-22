import type { Static } from '@sinclair/typebox'
import type { BlockItem } from '../../lib/content'
import {
  Alignment,
  Button,
  Card,
  Divider,
  Elevation,
  H1,
  H5,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Tag,
} from '@blueprintjs/core'
import { Box, Flex } from '@blueprintjs/labs'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { IconArrowLeft } from '@tabler/icons-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { ThemeToggle } from '../../components/ThemeToggle'
import { getBlockList } from '../../lib/content'
import styles from './index.module.css'

const BlocksSearchSchema = Type.Object({
  category: Type.String({ default: '' }),
})
type BlocksSearchParams = Static<typeof BlocksSearchSchema>

export const Route = createFileRoute('/blocks/')({
  validateSearch: (search: Record<string, unknown>): BlocksSearchParams => {
    const result = Value.Default(BlocksSearchSchema, { ...search })
    return Value.Check(BlocksSearchSchema, result) ? result as BlocksSearchParams : { category: '' }
  },
  loader: (): BlockItem[] => getBlockList(),
  head: () => ({
    meta: [
      { title: 'Blocks — CBBI Blueprint' },
      { name: 'description', content: 'A gallery of reusable UI blocks and chart components for the CBBI Blueprint project.' },
    ],
    links: [{ rel: 'canonical', href: 'https://cbbi.jkrumm.com/blocks' }],
  }),
  component: BlocksGalleryPage,
})

function BlocksGalleryPage() {
  const blocks = Route.useLoaderData()
  const { category: activeCategory } = Route.useSearch()

  const allCategories = useMemo(() => {
    const seen = new Set<string>()
    for (const block of blocks) seen.add(block.frontmatter.category)
    return seen.values().toArray().toSorted()
  }, [blocks])

  const visibleBlocks = useMemo(
    () => activeCategory ? blocks.filter(b => b.frontmatter.category === activeCategory) : blocks,
    [blocks, activeCategory],
  )

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Navbar style={{ position: 'sticky', top: 0, zIndex: 20 }}>
          <NavbarGroup align={Alignment.LEFT}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="minimal" icon={<IconArrowLeft size={16} />} text="CBBI" />
            </Link>
            <Divider />
            <NavbarHeading>Blocks</NavbarHeading>
          </NavbarGroup>
          <NavbarGroup align={Alignment.RIGHT}>
            <ThemeToggle />
          </NavbarGroup>
        </Navbar>

        <Box className={styles.container}>
          <H1 style={{ marginBottom: '1rem' }}>Blocks</H1>

          {allCategories.length > 0 && (
            <Flex gap={2} flexWrap="wrap" marginBottom={6}>
              <Link to="/blocks" search={{ category: '' }} style={{ textDecoration: 'none' }}>
                <Tag
                  interactive
                  intent={!activeCategory ? 'primary' : 'none'}
                >
                  All
                </Tag>
              </Link>
              {allCategories.map(cat => (
                <Link
                  key={cat}
                  to="/blocks"
                  search={{ category: activeCategory === cat ? '' : cat }}
                  style={{ textDecoration: 'none' }}
                >
                  <Tag
                    interactive
                    minimal={activeCategory !== cat}
                    intent={activeCategory === cat ? 'primary' : 'none'}
                  >
                    {cat}
                  </Tag>
                </Link>
              ))}
            </Flex>
          )}

          {visibleBlocks.length === 0
            ? (
                <p style={{ color: '#8f99a8' }}>No blocks for this category.</p>
              )
            : (
                <div className={styles.grid}>
                  {visibleBlocks.map(block => (
                    <Link
                      key={block.slug}
                      to="/blocks/$slug"
                      params={{ slug: block.slug }}
                      style={{ textDecoration: 'none' }}
                    >
                      <Card elevation={Elevation.ONE} interactive style={{ height: '100%' }}>
                        <Flex gap={2} flexWrap="wrap" marginBottom={2} alignItems="center">
                          <Tag minimal intent="primary">{block.frontmatter.category}</Tag>
                          {block.frontmatter.tags.map(tag => (
                            <Tag key={tag} minimal>{tag}</Tag>
                          ))}
                        </Flex>
                        <H5 style={{ marginBottom: '0.25rem' }}>{block.frontmatter.title}</H5>
                        <p className={styles.cardDescription}>{block.frontmatter.description}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
        </Box>
      </Box>
    </PageLayout>
  )
}
