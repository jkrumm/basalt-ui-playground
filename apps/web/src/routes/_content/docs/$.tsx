import type { Doc, DocNavSection } from "../../../lib/content";
import { NonIdealState } from "@blueprintjs/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { DocsLayout } from "../../../components/content/DocsLayout";
import { mdxComponents } from "../../../components/mdx/MDXComponents";
import { getDocsComponent, getDocsSidebar } from "../../../lib/content";
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
  // Strip /index suffix for component lookup: "getting-started/index" → "getting-started/index"
  // The component map key matches the file path, so slug is already correct.
  const MdxContent = useMemo(() => getDocsComponent(doc.slug), [doc.slug]);

  return (
    <DocsLayout sections={sections} headings={doc.headings}>
      {MdxContent ? (
        <MdxContent components={mdxComponents} /> // eslint-disable-line react-hooks/static-components -- stable import.meta.glob reference
      ) : (
        <NonIdealState icon={<IconAlertCircle size={40} />} title="Page not found" />
      )}
    </DocsLayout>
  );
}
