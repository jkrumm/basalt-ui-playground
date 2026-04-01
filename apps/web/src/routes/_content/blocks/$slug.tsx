import type { Block } from "../../../lib/content.ts";
import { MDXContent } from "@content-collections/mdx/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { BlockLayout } from "../../../components/content/BlockLayout.tsx";
import { mdxComponents } from "../../../components/mdx/MDXComponents.tsx";
import { allBlocks } from "content-collections";

const BASE_URL = "https://cbbi.jkrumm.com";

interface BlockLoaderData {
  block: Block;
}

export const Route = createFileRoute("/_content/blocks/$slug")({
  loader: ({ params }): BlockLoaderData => {
    const { slug } = params;
    const block = allBlocks.find((b) => b.slug === slug);
    if (!block) throw notFound();
    return { block };
  },
  head: ({ loaderData: ld }) => {
    if (!ld) return {};
    const { block } = ld;
    const url = `${BASE_URL}/blocks/${block.slug}`;
    return {
      meta: [
        { title: `${block.title} — CBBI Blueprint` },
        { name: "description", content: block.description },
        ...(block.noindex ? [{ name: "robots", content: "noindex" }] : []),
        { property: "og:title", content: block.title },
        { property: "og:description", content: block.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: BlockPage,
});

function BlockPage() {
  const { block } = Route.useLoaderData();

  return (
    <BlockLayout frontmatter={block} headings={block.headings}>
      <MDXContent code={block.body} components={mdxComponents} />
    </BlockLayout>
  );
}
