import type { BlogPost } from "../../../lib/content.ts";
import { H1, Tag } from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { z } from "zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BlogPostCard } from "../../../components/content/BlogPostCard.tsx";
import { PageLayout } from "../../../components/layout/PageLayout.tsx";
import { getBlogList } from "../../../lib/content.ts";
import styles from "./index.module.css";

const BlogSearchSchema = z.object({
  tag: z.string().default(""),
});
type BlogSearchParams = z.infer<typeof BlogSearchSchema>;

export const Route = createFileRoute("/_content/blog/")({
  validateSearch: (search: Record<string, unknown>): BlogSearchParams => {
    const result = BlogSearchSchema.safeParse(search);
    return result.success ? result.data : { tag: "" };
  },
  // getBlogList reads eagerly-bundled glob data — safe to call directly in the loader,
  // no createServerFn needed. Running isomorphically avoids HTTP round-trips during
  // prerendering that cause ETIMEDOUT when the prerender server is shutting down.
  loader: (): BlogPost[] => getBlogList(),
  head: () => ({
    meta: [
      { title: "Blog — CBBI Blueprint" },
      {
        name: "description",
        content: "Articles on TanStack Start, Blueprint, and on-chain analytics.",
      },
    ],
    links: [{ rel: "canonical", href: "https://cbbi.jkrumm.com/blog" }],
  }),
  component: BlogListingPage,
});

function BlogListingPage() {
  const posts = Route.useLoaderData();
  const { tag: activeTag } = Route.useSearch();

  const allTags = useMemo(() => {
    const seen = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) seen.add(tag);
    }
    return seen.values().toArray().toSorted();
  }, [posts]);

  const visiblePosts = useMemo(
    () => (activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts),
    [posts, activeTag],
  );

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Box className={styles.container}>
          <H1 style={{ marginBottom: "1rem" }}>Blog</H1>

          {allTags.length > 0 && (
            <Flex gap={2} flexWrap="wrap" marginBottom={6}>
              <Link to="/blog" search={{ tag: "" }} style={{ textDecoration: "none" }}>
                <Tag interactive intent={!activeTag ? "primary" : "none"}>
                  All
                </Tag>
              </Link>
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  to="/blog"
                  search={{ tag: activeTag === tag ? "" : tag }}
                  style={{ textDecoration: "none" }}
                >
                  <Tag
                    interactive
                    minimal={activeTag !== tag}
                    intent={activeTag === tag ? "primary" : "none"}
                  >
                    {tag}
                  </Tag>
                </Link>
              ))}
            </Flex>
          )}

          {visiblePosts.length === 0 ? (
            <p style={{ color: "#8f99a8" }}>No posts for this tag.</p>
          ) : (
            <div className={styles.grid}>
              {visiblePosts.map((post) => (
                <Link
                  key={post.slug}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  style={{ textDecoration: "none" }}
                >
                  <BlogPostCard post={post} />
                </Link>
              ))}
            </div>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
}
