import type { BlogPost } from "../../lib/content.ts";
import { Card, Elevation, H6, Tag } from "@blueprintjs/core";
import { Link } from "@tanstack/react-router";

interface RelatedPostsProps {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section
      style={{
        marginTop: "4rem",
        paddingTop: "2rem",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#5f6b7c",
          marginBottom: "1rem",
        }}
      >
        Related posts
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        {posts.map((post) => (
          <Link
            key={post.slug}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            style={{ textDecoration: "none" }}
          >
            <Card elevation={Elevation.ONE} interactive style={{ padding: "1rem", height: "100%" }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {post.tags.slice(0, 3).map((tag) => (
                  <Tag key={tag} minimal style={{ fontSize: 11 }}>
                    {tag}
                  </Tag>
                ))}
              </div>
              <H6 style={{ marginBottom: "0.25rem" }}>{post.title}</H6>
              <p style={{ color: "#8f99a8", fontSize: 13, margin: 0, lineHeight: 1.4 }}>
                {post.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
