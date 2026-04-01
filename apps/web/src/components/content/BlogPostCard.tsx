import type { BlogPost } from "../../lib/content.ts";
import { Card, Elevation, H5, Tag } from "@blueprintjs/core";
import { Flex } from "@blueprintjs/labs";
import styles from "./BlogPostCard.module.css";

interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Card elevation={Elevation.ONE} interactive className={styles.card} data-slug={post.slug}>
      <Flex gap={2} flexWrap="wrap" marginBottom={2}>
        {post.tags.map((tag) => (
          <Tag key={tag} minimal>
            {tag}
          </Tag>
        ))}
      </Flex>

      <H5 style={{ marginBottom: "0.5rem" }}>{post.title}</H5>

      <p className={styles.description}>{post.description}</p>

      <Flex gap={2} className={styles.meta}>
        <span>
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>·</span>
        <span>{post.readingTime}</span>
      </Flex>
    </Card>
  );
}
