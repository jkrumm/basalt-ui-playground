import { NonIdealState } from "@blueprintjs/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { DocsLayout } from "../../../components/content/DocsLayout";
import { mdxComponents } from "../../../components/mdx/MDXComponents";
import { getDocsComponent, getDocsSidebar } from "../../../lib/content";
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
  const { sections } = Route.useLoaderData();
  const MdxContent = useMemo(() => getDocsComponent("index"), []);

  return (
    <DocsLayout sections={sections}>
      {MdxContent ? (
        <MdxContent components={mdxComponents} /> // eslint-disable-line react-hooks/static-components -- stable import.meta.glob reference
      ) : (
        <NonIdealState icon={<IconAlertCircle size={40} />} title="Page not found" />
      )}
    </DocsLayout>
  );
}
