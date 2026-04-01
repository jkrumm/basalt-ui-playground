import type { ContentType, SearchDocument } from "../../lib/content.ts";
import { Card, Classes, Elevation, H1, InputGroup, Tag } from "@blueprintjs/core";
import { Search } from "@blueprintjs/icons";
import { Box, Flex } from "@blueprintjs/labs";
import { createFileRoute } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { PageLayout } from "../../components/layout/PageLayout.tsx";
import { EVENTS, track } from "../../lib/analytics.ts";
import { getSearchIndex, INDEX_SUFFIX_RE } from "../../lib/content.ts";
import styles from "./search.module.css";

export const Route = createFileRoute("/_content/search")({
  loader: (): SearchDocument[] => getSearchIndex(),
  head: () => ({
    meta: [
      { title: "Search — CBBI Blueprint" },
      { name: "description", content: "Search blog posts, documentation, guides, and blocks." },
    ],
    links: [{ rel: "canonical", href: "https://cbbi.jkrumm.com/search" }],
  }),
  component: SearchPage,
});

const TYPE_CONFIG: Record<
  ContentType,
  { label: string; intent: "primary" | "success" | "warning" | "danger" | "none" }
> = {
  blog: { label: "Blog", intent: "primary" },
  docs: { label: "Docs", intent: "success" },
  guide: { label: "Guide", intent: "warning" },
  block: { label: "Block", intent: "none" },
};

function getResultTo(item: SearchDocument): string {
  switch (item.type) {
    case "blog":
      return `/blog/${item.slug}`;
    case "docs":
      return `/docs/${item.slug.replace(INDEX_SUFFIX_RE, "")}`;
    case "guide":
      return `/guides/${item.slug}`;
    case "block":
      return `/blocks/${item.slug}`;
    default:
      return "/";
  }
}

function SearchPage() {
  const documents = Route.useLoaderData();
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(documents, {
        keys: [
          { name: "title", weight: 2 },
          { name: "description", weight: 1 },
          { name: "tags", weight: 1.5 },
          { name: "section", weight: 0.5 },
          { name: "category", weight: 0.5 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [documents],
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 12);
  }, [fuse, query]);

  const counts = useMemo(() => {
    const byType: Partial<Record<ContentType, number>> = {};
    for (const doc of documents) {
      byType[doc.type] = (byType[doc.type] ?? 0) + 1;
    }
    return byType;
  }, [documents]);

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Box className={styles.container}>
          <H1 style={{ marginBottom: "1.5rem" }}>Search</H1>

          <InputGroup
            large
            leftIcon={<Search />}
            placeholder="Search blog, docs, guides, blocks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{ marginBottom: "1.5rem" }}
          />

          {query.trim() && results.length === 0 && (
            <p className={Classes.TEXT_MUTED}>
              No results for &ldquo;
              {query}
              &rdquo;
            </p>
          )}

          <Flex flexDirection="column" gap={2}>
            {results.map(({ item }) => {
              const cfg = TYPE_CONFIG[item.type] ?? { label: item.type, intent: "none" as const };
              const href = getResultTo(item);
              return (
                <a
                  key={`${item.type}/${item.slug}`}
                  href={href}
                  style={{ textDecoration: "none" }}
                  onClick={() =>
                    track(EVENTS.SEARCH_QUERY, {
                      query: query.trim(),
                      result_count: results.length,
                    })
                  }
                >
                  <Card elevation={Elevation.ONE} interactive style={{ padding: "1rem" }}>
                    <Flex gap={2} alignItems="center" marginBottom={1}>
                      <Tag intent={cfg.intent} minimal>
                        {cfg.label}
                      </Tag>
                      {item.section && (
                        <>
                          <span className={Classes.TEXT_MUTED}>›</span>
                          <span className={Classes.TEXT_MUTED}>{item.section}</span>
                        </>
                      )}
                      {item.category && (
                        <>
                          <span className={Classes.TEXT_MUTED}>›</span>
                          <span className={Classes.TEXT_MUTED}>{item.category}</span>
                        </>
                      )}
                    </Flex>
                    <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{item.title}</p>
                    <p className={Classes.TEXT_MUTED} style={{ margin: 0, lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <Flex gap={1} flexWrap="wrap" marginTop={2}>
                        {item.tags.slice(0, 4).map((tag) => (
                          <Tag key={tag} minimal>
                            {tag}
                          </Tag>
                        ))}
                      </Flex>
                    )}
                  </Card>
                </a>
              );
            })}
          </Flex>

          {!query.trim() && (
            <Box marginTop={8}>
              <Flex gap={3} flexWrap="wrap">
                {(Object.entries(counts) as [ContentType, number][]).map(([type, count]) => {
                  const typeCfg = TYPE_CONFIG[type];
                  if (!typeCfg) return null;
                  return (
                    <span key={type} className={Classes.TEXT_MUTED}>
                      {count}{" "}
                      <Tag intent={typeCfg.intent} minimal>
                        {typeCfg.label}
                      </Tag>
                    </span>
                  );
                })}
              </Flex>
            </Box>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
}
