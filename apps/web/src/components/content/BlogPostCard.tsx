import type { BlogPost } from '../../lib/content'
import { Card, Elevation, H5, Tag } from '@blueprintjs/core'
import { Flex } from '@blueprintjs/labs'
import styles from './BlogPostCard.module.css'

interface BlogPostCardProps {
  post: BlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const { slug, frontmatter, readingTime } = post

  return (
    <Card
      elevation={Elevation.ONE}
      interactive
      className={styles.card}
      data-slug={slug}
    >
      <Flex gap={2} flexWrap="wrap" marginBottom={2}>
        {frontmatter.tags.map(tag => (
          <Tag key={tag} minimal>
            {tag}
          </Tag>
        ))}
      </Flex>

      <H5 style={{ marginBottom: '0.5rem' }}>{frontmatter.title}</H5>

      <p className={styles.description}>{frontmatter.description}</p>

      <Flex gap={2} className={styles.meta}>
        <span>
          {new Date(frontmatter.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <span>·</span>
        <span>{readingTime}</span>
      </Flex>
    </Card>
  )
}
