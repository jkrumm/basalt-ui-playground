import type { Static } from '@sinclair/typebox'
import type { BlogPost } from '../../lib/content'
import {
  Alignment,
  Button,
  Divider,
  H1,
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
import { BlogPostCard } from '../../components/content/BlogPostCard'
import { PageLayout } from '../../components/layout/PageLayout'
import { ThemeToggle } from '../../components/ThemeToggle'
import { getBlogList } from '../../lib/content'
import styles from './index.module.css'

const BlogSearchSchema = Type.Object({
  tag: Type.String({ default: '' }),
})
type BlogSearchParams = Static<typeof BlogSearchSchema>

export const Route = createFileRoute('/blog/')({
  validateSearch: (search: Record<string, unknown>): BlogSearchParams => {
    const result = Value.Default(BlogSearchSchema, { ...search })
    return Value.Check(BlogSearchSchema, result) ? result as BlogSearchParams : { tag: '' }
  },
  // getBlogList reads eagerly-bundled glob data — safe to call directly in the loader,
  // no createServerFn needed. Running isomorphically avoids HTTP round-trips during
  // prerendering that cause ETIMEDOUT when the prerender server is shutting down.
  loader: (): BlogPost[] => getBlogList(),
  head: () => ({
    meta: [
      { title: 'Blog — CBBI Blueprint' },
      { name: 'description', content: 'Articles on TanStack Start, Blueprint, and on-chain analytics.' },
    ],
    links: [{ rel: 'canonical', href: 'https://cbbi.jkrumm.com/blog' }],
  }),
  component: BlogListingPage,
})

function BlogListingPage() {
  const posts = Route.useLoaderData()
  const { tag: activeTag } = Route.useSearch()

  const allTags = useMemo(() => {
    const seen = new Set<string>()
    for (const post of posts) {
      for (const tag of post.frontmatter.tags) seen.add(tag)
    }
    return seen.values().toArray().toSorted()
  }, [posts])

  const visiblePosts = useMemo(
    () => activeTag ? posts.filter(p => p.frontmatter.tags.includes(activeTag)) : posts,
    [posts, activeTag],
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
            <NavbarHeading>Blog</NavbarHeading>
          </NavbarGroup>
          <NavbarGroup align={Alignment.RIGHT}>
            <ThemeToggle />
          </NavbarGroup>
        </Navbar>

        <Box className={styles.container}>
          <H1 style={{ marginBottom: '1rem' }}>Blog</H1>

          {allTags.length > 0 && (
            <Flex gap={2} flexWrap="wrap" marginBottom={6}>
              <Link to="/blog" search={{ tag: '' }} style={{ textDecoration: 'none' }}>
                <Tag
                  interactive
                  intent={!activeTag ? 'primary' : 'none'}
                >
                  All
                </Tag>
              </Link>
              {allTags.map(tag => (
                <Link
                  key={tag}
                  to="/blog"
                  search={{ tag: activeTag === tag ? '' : tag }}
                  style={{ textDecoration: 'none' }}
                >
                  <Tag
                    interactive
                    minimal={activeTag !== tag}
                    intent={activeTag === tag ? 'primary' : 'none'}
                  >
                    {tag}
                  </Tag>
                </Link>
              ))}
            </Flex>
          )}

          {visiblePosts.length === 0
            ? (
                <p style={{ color: '#8f99a8' }}>No posts for this tag.</p>
              )
            : (
                <div className={styles.grid}>
                  {visiblePosts.map(post => (
                    <Link
                      key={post.slug}
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      style={{ textDecoration: 'none' }}
                    >
                      <BlogPostCard post={post} />
                    </Link>
                  ))}
                </div>
              )}
        </Box>
      </Box>
    </PageLayout>
  )
}
