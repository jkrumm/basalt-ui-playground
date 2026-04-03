import type { Doc } from "../../../lib/content.ts";
import { Classes } from "@blueprintjs/core";
import { MDXContent } from "@content-collections/mdx/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { mdxComponents } from "../../../components/mdx/MDXComponents.tsx";
import { allDocs } from "content-collections";

interface DocsPageData {
  doc: Doc;
}

export const Route = createFileRoute("/_docs/docs/$")({
  loader: ({ params }): DocsPageData => {
    const splat = params._splat ?? "";
    // Try direct slug, then /index fallback for directory index pages
    const doc =
      allDocs.find((d) => d.slug === (splat || "index")) ??
      (splat ? allDocs.find((d) => d.slug === `${splat}/index`) : undefined);
    if (!doc) throw notFound();
    return { doc };
  },
  head: ({ loaderData: ld, params }) => {
    if (!ld) return {};
    return {
      meta: [
        { title: `${ld.doc.title} — CBBI Blueprint` },
        { name: "description", content: ld.doc.description },
      ],
      links: [{ rel: "canonical", href: `https://cbbi.jkrumm.com/docs/${params._splat ?? ""}` }],
    };
  },
  component: DocsPage,
});

function DocsPage() {
  const { doc } = Route.useLoaderData();

  return (
    <div
      className={`${Classes.RUNNING_TEXT} mdx-content`}
      style={{ padding: "1rem" }}
    >
      <MDXContent code={doc.body} components={mdxComponents} />
    </div>
  );
}
