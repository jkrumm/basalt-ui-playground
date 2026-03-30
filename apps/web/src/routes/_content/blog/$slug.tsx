import type { Post, PrevNext } from "../../../lib/content";
import { NonIdealState } from "@blueprintjs/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { BlogLayout } from "../../../components/content/BlogLayout";
import { RelatedPosts } from "../../../components/content/RelatedPosts";
import { mdxComponents } from "../../../components/mdx/MDXComponents";
import {
  getBlogComponent,
  getPrevNextPosts,
  getRelatedPosts,
  getSeriesPosts,
} from "../../../lib/content";
import { allPosts } from "content-collections";

const BASE_URL = "https://cbbi.jkrumm.com";

interface PostLoaderData {
  post: Post;
  related: Post[];
  seriesPosts: Post[];
  prevNext: PrevNext;
}

export const Route = createFileRoute("/_content/blog/$slug")({
  loader: ({ params }): PostLoaderData => {
    const { slug } = params;
    const post = allPosts.find((p) => p.slug === slug);
    if (!post) throw notFound();
    return {
      post,
      related: getRelatedPosts(slug),
      seriesPosts: post.series ? getSeriesPosts(post.series) : [],
      prevNext: getPrevNextPosts(slug),
    };
  },
  head: ({ loaderData: ld }) => {
    if (!ld) return {};
    const { post } = ld;
    const url = `${BASE_URL}/blog/${post.slug}`;
    const canonical = post.canonicalUrl ?? url;
    const socialImage = post.ogImage ?? post.image;
    const resolvedImage = socialImage
      ? socialImage.startsWith("http")
        ? socialImage
        : `${BASE_URL}${socialImage}`
      : undefined;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      author: {
        "@type": "Person",
        name: post.author,
        ...(post.authorUrl ? { url: post.authorUrl } : {}),
      },
      ...(resolvedImage ? { image: resolvedImage } : {}),
      url,
      keywords: post.tags.join(", "),
    };
    return {
      meta: [
        { title: `${post.title} — CBBI Blueprint` },
        { name: "description", content: post.description },
        ...(post.noindex ? [{ name: "robots", content: "noindex" }] : []),
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        ...(resolvedImage ? [{ property: "og:image", content: resolvedImage }] : []),
        { name: "article:published_time", content: post.publishedAt },
        ...(post.updatedAt ? [{ name: "article:modified_time", content: post.updatedAt }] : []),
        ...post.tags.map((tag) => ({ name: "article:tag", content: tag })),
        { name: "twitter:card", content: resolvedImage ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.description },
        ...(resolvedImage ? [{ name: "twitter:image", content: resolvedImage }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post, related, seriesPosts, prevNext } = Route.useLoaderData();
  const MdxContent = useMemo(() => getBlogComponent(post.slug), [post.slug]);

  return (
    <BlogLayout
      frontmatter={post}
      readingTime={post.readingTime}
      headings={post.headings}
      seriesPosts={seriesPosts}
      currentSlug={post.slug}
      prevNext={prevNext}
    >
      {MdxContent ? (
        <MdxContent components={mdxComponents} /> // eslint-disable-line react-hooks/static-components -- stable import.meta.glob reference
      ) : (
        <NonIdealState icon={<IconAlertCircle size={40} />} title="Failed to load post" />
      )}
      {related.length > 0 && <RelatedPosts posts={related} />}
    </BlogLayout>
  );
}
