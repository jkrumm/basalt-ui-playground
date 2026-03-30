import type { Guide } from "../../../lib/content";
import { MDXContent } from "@content-collections/mdx/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { GuideLayout } from "../../../components/content/GuideLayout";
import { mdxComponents } from "../../../components/mdx/MDXComponents";
import { getPrevNextGuides } from "../../../lib/content";
import { allGuides } from "content-collections";

const BASE_URL = "https://cbbi.jkrumm.com";

interface GuideLoaderData {
  guide: Guide;
  prevNext: { prev: Guide | null; next: Guide | null };
}

export const Route = createFileRoute("/_content/guides/$slug")({
  loader: ({ params }): GuideLoaderData => {
    const { slug } = params;
    const guide = allGuides.find((g) => g.slug === slug);
    if (!guide) throw notFound();
    return { guide, prevNext: getPrevNextGuides(slug) };
  },
  head: ({ loaderData: ld }) => {
    if (!ld) return {};
    const { guide } = ld;
    const url = `${BASE_URL}/guides/${guide.slug}`;
    const resolvedImage = guide.ogImage
      ? guide.ogImage.startsWith("http")
        ? guide.ogImage
        : `${BASE_URL}${guide.ogImage}`
      : undefined;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.publishedAt,
      dateModified: guide.updatedAt ?? guide.publishedAt,
      ...(guide.author ? { author: { "@type": "Person", name: guide.author } } : {}),
      ...(resolvedImage ? { image: resolvedImage } : {}),
      url,
      keywords: guide.tags.join(", "),
    };
    return {
      meta: [
        { title: `${guide.title} — CBBI Blueprint` },
        { name: "description", content: guide.description },
        ...(guide.noindex ? [{ name: "robots", content: "noindex" }] : []),
        { property: "og:title", content: guide.title },
        { property: "og:description", content: guide.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(resolvedImage ? [{ property: "og:image", content: resolvedImage }] : []),
        { name: "article:published_time", content: guide.publishedAt },
        ...(guide.updatedAt ? [{ name: "article:modified_time", content: guide.updatedAt }] : []),
        ...guide.tags.map((tag) => ({ name: "article:tag", content: tag })),
        { name: "twitter:card", content: resolvedImage ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: guide.title },
        { name: "twitter:description", content: guide.description },
        ...(resolvedImage ? [{ name: "twitter:image", content: resolvedImage }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: GuidePage,
});

function GuidePage() {
  const { guide, prevNext } = Route.useLoaderData();

  return (
    <GuideLayout
      frontmatter={guide}
      readingTime={guide.readingTime}
      headings={guide.headings}
      prevNext={prevNext}
    >
      <MDXContent code={guide.body} components={mdxComponents} />
    </GuideLayout>
  );
}
