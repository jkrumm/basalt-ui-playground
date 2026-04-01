import type { Doc, DocNavSection } from "../../../lib/content.ts";
import { MDXContent } from "@content-collections/mdx/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "../../../components/content/DocsLayout.tsx";
import { mdxComponents } from "../../../components/mdx/MDXComponents.tsx";
import { getDocsSidebar } from "../../../lib/content.ts";
import { allDocs } from "content-collections";

interface DocsPageData {
  doc: Doc;
  sections: DocNavSection[];
}

export const Route = createFileRoute("/_content/docs/$")({
  loader: ({ params }): DocsPageData => {
    const splat = params._splat ?? "";
    // Try direct slug, then /index fallback for directory index pages
    const doc =
      allDocs.find((d) => d.slug === (splat || "index")) ??
      (splat ? allDocs.find((d) => d.slug === `${splat}/index`) : undefined);
    if (!doc) throw notFound();
    return { doc, sections: getDocsSidebar() };
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
  const { doc, sections } = Route.useLoaderData();

  return (
    <DocsLayout sections={sections} headings={doc.headings}>
      <MDXContent code={doc.body} components={mdxComponents} />
    </DocsLayout>
  );
}
