import type { GuideItem } from "../../../lib/content.ts";
import { H1, HTMLSelect, Tag } from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { z } from "zod";
import { IconClock } from "@tabler/icons-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageLayout } from "../../../components/layout/PageLayout.tsx";
import { getGuideList } from "../../../lib/content.ts";
import styles from "./index.module.css";

const GuideSearchSchema = z.object({
  category: z.string().default(""),
  difficulty: z.string().default(""),
});
type GuideSearchParams = z.infer<typeof GuideSearchSchema>;

const DIFFICULTY_INTENTS = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
} as const;

export const Route = createFileRoute("/_content/guides/")({
  validateSearch: (search: Record<string, unknown>): GuideSearchParams => {
    const result = GuideSearchSchema.safeParse(search);
    return result.success ? result.data : { category: "", difficulty: "" };
  },
  loader: (): GuideItem[] => getGuideList(),
  head: () => ({
    meta: [
      { title: "Guides — CBBI Blueprint" },
      {
        name: "description",
        content:
          "In-depth guides on Bitcoin on-chain indicators, market cycles, and CBBI score interpretation.",
      },
    ],
    links: [{ rel: "canonical", href: "https://cbbi.jkrumm.com/guides" }],
  }),
  component: GuidesListingPage,
});

function GuidesListingPage() {
  const guides = Route.useLoaderData();
  const { category: activeCategory, difficulty: activeDifficulty } = Route.useSearch();
  const navigate = useNavigate({ from: "/guides/" });

  const { allCategories, allDifficulties } = useMemo(() => {
    const cats = new Set<string>();
    const diffs = new Set<string>();
    for (const guide of guides) {
      cats.add(guide.category);
      diffs.add(guide.difficulty);
    }
    return {
      allCategories: cats.values().toArray().toSorted(),
      allDifficulties: diffs.values().toArray().toSorted(),
    };
  }, [guides]);

  const visibleGuides = useMemo(() => {
    return guides.filter((g) => {
      if (activeCategory && g.category !== activeCategory) return false;
      if (activeDifficulty && g.difficulty !== activeDifficulty) return false;
      return true;
    });
  }, [guides, activeCategory, activeDifficulty]);

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Box className={styles.container}>
          <H1 style={{ marginBottom: "1rem" }}>Guides</H1>

          {/* Filters */}
          <Flex gap={4} flexWrap="wrap" alignItems="center" marginBottom={6}>
            {/* Difficulty filter */}
            <Flex gap={2} flexWrap="wrap">
              <Link
                to="/guides"
                search={{ category: activeCategory, difficulty: "" }}
                style={{ textDecoration: "none" }}
              >
                <Tag interactive intent={!activeDifficulty ? "primary" : "none"}>
                  All levels
                </Tag>
              </Link>
              {allDifficulties.map((diff) => (
                <Link
                  key={diff}
                  to="/guides"
                  search={{
                    category: activeCategory,
                    difficulty: activeDifficulty === diff ? "" : diff,
                  }}
                  style={{ textDecoration: "none" }}
                >
                  <Tag
                    interactive
                    minimal={activeDifficulty !== diff}
                    intent={
                      activeDifficulty === diff
                        ? (DIFFICULTY_INTENTS[diff as keyof typeof DIFFICULTY_INTENTS] ?? "none")
                        : "none"
                    }
                  >
                    {diff}
                  </Tag>
                </Link>
              ))}
            </Flex>

            {/* Category select */}
            {allCategories.length > 1 && (
              <HTMLSelect
                value={activeCategory}
                onChange={(e) =>
                  navigate({
                    search: { category: e.currentTarget.value, difficulty: activeDifficulty },
                  })
                }
              >
                <option value="">All categories</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </HTMLSelect>
            )}
          </Flex>

          {visibleGuides.length === 0 ? (
            <p style={{ color: "#8f99a8" }}>No guides match the selected filters.</p>
          ) : (
            <div className={styles.grid}>
              {visibleGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  to="/guides/$slug"
                  params={{ slug: guide.slug }}
                  style={{ textDecoration: "none" }}
                >
                  <GuideCard guide={guide} />
                </Link>
              ))}
            </div>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
}

function GuideCard({ guide }: { guide: GuideItem }) {
  const diffIntent = DIFFICULTY_INTENTS[guide.difficulty] ?? "none";

  return (
    <div className={styles.card}>
      <Flex gap={2} flexWrap="wrap" alignItems="center" marginBottom={2}>
        <Tag intent={diffIntent} minimal>
          {guide.difficulty}
        </Tag>
        <Tag minimal>{guide.category}</Tag>
      </Flex>

      <p className={styles.cardTitle}>{guide.title}</p>
      <p className={styles.description}>{guide.description}</p>

      <Flex gap={2} flexWrap="wrap" marginBottom={2}>
        {guide.tags.map((tag) => (
          <Tag key={tag} minimal style={{ fontSize: "11px" }}>
            {tag}
          </Tag>
        ))}
      </Flex>

      <Flex gap={2} alignItems="center" className={styles.meta}>
        <IconClock size={12} />
        <span>{guide.estimatedTime ?? guide.readingTime}</span>
        <span>·</span>
        <span>{guide.readingTime}</span>
      </Flex>
    </div>
  );
}
