import type { SearchDocument } from "../../lib/content.ts";
import { Card, Classes, Dialog, Elevation, InputGroup, Tag } from "@blueprintjs/core";
import { Search } from "@blueprintjs/icons";
import { Box, Flex } from "@blueprintjs/labs";
import { Link } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSearchIndex, INDEX_SUFFIX_RE } from "../../lib/content.ts";
import styles from "./SearchModal.module.css";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  // Lazy initializer — getSearchIndex reads bundled glob data, safe to call on mount
  const [documents] = useState<SearchDocument[]>(() => getSearchIndex());
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query and refocus on each open
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
    // Delay focus to let Blueprint's Dialog animation finish
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const fuse = useMemo(
    () =>
      new Fuse(documents, {
        keys: [
          { name: "title", weight: 2 },
          { name: "description", weight: 1 },
          { name: "tags", weight: 1.5 },
          { name: "section", weight: 0.5 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [documents],
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 8);
  }, [fuse, query]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      canOutsideClickClose
      canEscapeKeyClose
      style={{ width: 600, padding: 0, overflow: "hidden" }}
    >
      <Box className={styles.inputWrapper}>
        <InputGroup
          inputRef={inputRef}
          large
          leftIcon={<Search />}
          placeholder="Search posts and docs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rightElement={<kbd className={styles.kbdHint}>ESC</kbd>}
        />
      </Box>

      <Box className={styles.results}>
        {query.trim() && results.length === 0 && (
          <p
            className={`${Classes.TEXT_MUTED} ${styles.resultDesc}`}
            style={{ padding: "0.5rem 0" }}
          >
            No results for &ldquo;
            {query}
            &rdquo;
          </p>
        )}

        {!query.trim() && (
          <p
            className={`${Classes.TEXT_MUTED} ${styles.resultDesc}`}
            style={{ padding: "0.25rem 0 0" }}
          >
            {documents.length > 0
              ? `Searching across ${documents.filter((d) => d.type === "blog").length} blog posts and ${documents.filter((d) => d.type === "docs").length} docs pages`
              : "Loading…"}
          </p>
        )}

        <Flex flexDirection="column" gap={2}>
          {results.map(({ item }) => (
            <Link
              key={`${item.type}/${item.slug}`}
              to={item.type === "blog" ? "/blog/$slug" : "/docs/$"}
              params={
                item.type === "blog"
                  ? { slug: item.slug }
                  : { _splat: item.slug.replace(INDEX_SUFFIX_RE, "") }
              }
              className={styles.navLink}
              onClick={onClose}
            >
              <Card elevation={Elevation.ONE} interactive style={{ padding: "0.75rem 1rem" }}>
                <Flex gap={2} alignItems="center" marginBottom={0.5}>
                  <Tag intent={item.type === "blog" ? "primary" : "success"} minimal>
                    {item.type === "blog" ? "Blog" : "Docs"}
                  </Tag>
                  {item.section && (
                    <>
                      <span className={Classes.TEXT_MUTED}>›</span>
                      <span className={Classes.TEXT_MUTED}>{item.section}</span>
                    </>
                  )}
                </Flex>
                <p className={styles.resultTitle}>{item.title}</p>
                <p className={styles.resultDesc}>{item.description}</p>
                {item.tags && item.tags.length > 0 && (
                  <Flex gap={1} flexWrap="wrap" marginTop={2}>
                    {item.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag} minimal>
                        {tag}
                      </Tag>
                    ))}
                  </Flex>
                )}
              </Card>
            </Link>
          ))}
        </Flex>
      </Box>
    </Dialog>
  );
}
