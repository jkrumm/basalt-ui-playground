import type { BlockItem } from "../../../lib/content.ts";
import { Card, Elevation, H1, H5, Tag } from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { z } from "zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageLayout } from "../../../components/layout/PageLayout.tsx";
import { getBlockList } from "../../../lib/content.ts";
import styles from "./index.module.css";

const BlocksSearchSchema = z.object({
  category: z.string().default(""),
});
type BlocksSearchParams = z.infer<typeof BlocksSearchSchema>;

export const Route = createFileRoute("/_content/blocks/")({
  validateSearch: (search: Record<string, unknown>): BlocksSearchParams => {
    const result = BlocksSearchSchema.safeParse(search);
    return result.success ? result.data : { category: "" };
  },
  loader: (): BlockItem[] => getBlockList(),
  head: () => ({
    meta: [
      { title: "Blocks — CBBI Blueprint" },
      {
        name: "description",
        content:
          "A gallery of reusable UI blocks and chart components for the CBBI Blueprint project.",
      },
    ],
    links: [{ rel: "canonical", href: "https://cbbi.jkrumm.com/blocks" }],
  }),
  component: BlocksGalleryPage,
});

function BlocksGalleryPage() {
  const blocks = Route.useLoaderData();
  const { category: activeCategory } = Route.useSearch();

  const allCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const block of blocks) seen.add(block.category);
    return seen.values().toArray().toSorted();
  }, [blocks]);

  const visibleBlocks = useMemo(
    () => (activeCategory ? blocks.filter((b) => b.category === activeCategory) : blocks),
    [blocks, activeCategory],
  );

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Box className={styles.container}>
          <H1 style={{ marginBottom: "1rem" }}>Blocks</H1>

          {allCategories.length > 0 && (
            <Flex gap={2} flexWrap="wrap" marginBottom={6}>
              <Link to="/blocks" search={{ category: "" }} style={{ textDecoration: "none" }}>
                <Tag interactive intent={!activeCategory ? "primary" : "none"}>
                  All
                </Tag>
              </Link>
              {allCategories.map((cat) => (
                <Link
                  key={cat}
                  to="/blocks"
                  search={{ category: activeCategory === cat ? "" : cat }}
                  style={{ textDecoration: "none" }}
                >
                  <Tag
                    interactive
                    minimal={activeCategory !== cat}
                    intent={activeCategory === cat ? "primary" : "none"}
                  >
                    {cat}
                  </Tag>
                </Link>
              ))}
            </Flex>
          )}

          {visibleBlocks.length === 0 ? (
            <p style={{ color: "#8f99a8" }}>No blocks for this category.</p>
          ) : (
            <div className={styles.grid}>
              {visibleBlocks.map((block) => (
                <Link
                  key={block.slug}
                  to="/blocks/$slug"
                  params={{ slug: block.slug }}
                  style={{ textDecoration: "none" }}
                >
                  <Card elevation={Elevation.ONE} interactive style={{ height: "100%" }}>
                    <Flex gap={2} flexWrap="wrap" marginBottom={2} alignItems="center">
                      <Tag minimal intent="primary">
                        {block.category}
                      </Tag>
                      {block.tags.map((tag) => (
                        <Tag key={tag} minimal>
                          {tag}
                        </Tag>
                      ))}
                    </Flex>
                    <H5 style={{ marginBottom: "0.25rem" }}>{block.title}</H5>
                    <p className={styles.cardDescription}>{block.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
}
