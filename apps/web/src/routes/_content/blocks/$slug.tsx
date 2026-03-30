import type { Block } from "../../../lib/content";
import { NonIdealState } from "@blueprintjs/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { BlockLayout } from "../../../components/content/BlockLayout";
import { mdxComponents } from "../../../components/mdx/MDXComponents";
import { getBlocksComponent } from "../../../lib/content";
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
  const MdxContent = useMemo(() => getBlocksComponent(block.slug), [block.slug]);

  return (
    <BlockLayout frontmatter={block} headings={block.headings}>
      {MdxContent ? (
        <MdxContent components={mdxComponents} /> // eslint-disable-line react-hooks/static-components -- stable import.meta.glob reference
      ) : (
        <NonIdealState icon={<IconAlertCircle size={40} />} title="Failed to load block" />
      )}
    </BlockLayout>
  );
}
