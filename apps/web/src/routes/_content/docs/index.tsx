import { MDXContent } from "@content-collections/mdx/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "../../../components/content/DocsLayout";
import { mdxComponents } from "../../../components/mdx/MDXComponents";
import { getDocsSidebar } from "../../../lib/content";
import { allDocs } from "content-collections";

export const Route = createFileRoute("/_content/docs/")({
  loader: () => {
    const doc = allDocs.find((d) => d.slug === "index");
    if (!doc) throw notFound();
    return { doc, sections: getDocsSidebar() };
  },
  head: ({ loaderData: ld }) => {
    if (!ld) return {};
    return {
      meta: [
        { title: `${ld.doc.title} — CBBI Blueprint` },
        { name: "description", content: ld.doc.description },
      ],
      links: [{ rel: "canonical", href: "https://cbbi.jkrumm.com/docs" }],
    };
  },
  component: DocsIndexPage,
});

function DocsIndexPage() {
  const { doc, sections } = Route.useLoaderData();

  return (
    <DocsLayout sections={sections} headings={doc.headings}>
      <MDXContent code={doc.body} components={mdxComponents} />
    </DocsLayout>
  );
}
