import { MDXContent } from "@content-collections/mdx/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { mdxComponents } from "../../../components/mdx/MDXComponents.tsx";
import { allDocs } from "content-collections";

export const Route = createFileRoute("/_docs/docs/")({
  loader: () => {
    const doc = allDocs.find((d) => d.slug === "index");
    if (!doc) throw notFound();
    return { doc };
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
  const { doc } = Route.useLoaderData();

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <MDXContent code={doc.body} components={mdxComponents} />
    </div>
  );
}
