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
import { IconArrowLeft } from '@tabler/icons-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { BlogPostCard } from '../../components/content/BlogPostCard'
import { ThemeToggle } from '../../components/ThemeToggle'
import { getBlogList } from '../../lib/content'

export const Route = createFileRoute('/blog/')({
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
  const [activeTag, setActiveTag] = useState<string | null>(null)

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
    <div style={{ minHeight: '100vh', paddingBottom: 64 }}>
      <Navbar>
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

      <div style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1.25rem' }}>
        <H1 style={{ marginBottom: '1rem' }}>Blog</H1>

        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <Tag
              interactive
              intent={activeTag === null ? 'primary' : 'none'}
              onClick={() => setActiveTag(null)}
            >
              All
            </Tag>
            {allTags.map(tag => (
              <Tag
                key={tag}
                interactive
                minimal={activeTag !== tag}
                intent={activeTag === tag ? 'primary' : 'none'}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {visiblePosts.length === 0
          ? (
              <p style={{ color: '#8f99a8' }}>No posts for this tag.</p>
            )
          : (
              <div className="cbbi-grid">
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
      </div>
    </div>
  )
}
