import type { BlogPost } from '../../lib/content'
import { Card, Elevation, H5, Tag } from '@blueprintjs/core'

interface BlogPostCardProps {
  post: BlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const { slug, frontmatter, readingTime } = post

  return (
    // Outer <a> is handled by the parent Link — this card is the visual element
    <Card
      elevation={Elevation.ONE}
      interactive
      style={{ padding: '1.25rem', height: '100%', cursor: 'pointer' }}
      data-slug={slug}
    >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        {frontmatter.tags.map(tag => (
          <Tag key={tag} minimal>
            {tag}
          </Tag>
        ))}
      </div>

      <H5 style={{ marginBottom: '0.5rem' }}>{frontmatter.title}</H5>

      <p style={{ color: '#8f99a8', fontSize: 14, marginBottom: '0.75rem', lineHeight: 1.5 }}>
        {frontmatter.description}
      </p>

      <div style={{ display: 'flex', gap: 8, color: '#5f6b7c', fontSize: 13 }}>
        <span>
          {new Date(frontmatter.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <span>·</span>
        <span>{readingTime}</span>
      </div>
    </Card>
  )
}
