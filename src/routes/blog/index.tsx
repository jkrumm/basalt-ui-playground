import type { BlogPost } from '../../lib/content'
import {
  Alignment,
  Button,
  Divider,
  H1,
  Navbar,
  NavbarGroup,
  NavbarHeading,
} from '@blueprintjs/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { BlogPostCard } from '../../components/content/BlogPostCard'
import { ThemeToggle } from '../../components/ThemeToggle'
import { getBlogList } from '../../lib/content'

const getBlogListFn = createServerFn({ method: 'GET' }).handler((): BlogPost[] => {
  return getBlogList()
})

export const Route = createFileRoute('/blog/')({
  loader: () => getBlogListFn(),
  head: () => ({
    meta: [
      { title: 'Blog — CBBI Blueprint' },
      { name: 'description', content: 'Articles on TanStack Start, Blueprint, and on-chain analytics.' },
    ],
  }),
  component: BlogListingPage,
})

function BlogListingPage() {
  const posts = Route.useLoaderData() as BlogPost[]

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
        <H1 style={{ marginBottom: '1.5rem' }}>Blog</H1>

        {posts.length === 0
          ? (
              <p style={{ color: '#8f99a8' }}>No posts yet.</p>
            )
          : (
              <div className="cbbi-grid">
                {posts.map(post => (
                  <BlogPostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
      </div>
    </div>
  )
}
