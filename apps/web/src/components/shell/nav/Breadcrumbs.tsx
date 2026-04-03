import type { BreadcrumbProps } from "@blueprintjs/core";
import { Breadcrumbs as BpBreadcrumbs } from "@blueprintjs/core";
import { useMatches } from "@tanstack/react-router";

function humanize(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const PATHLESS_LAYOUT_RE = /^\/_/;

export function Breadcrumbs() {
  const matches = useMatches();

  const items: BreadcrumbProps[] = matches
    .filter((match) => !PATHLESS_LAYOUT_RE.test(match.routeId))
    .map((match) => ({
      text:
        (match.staticData as { nav?: { breadcrumb?: string } } | undefined)?.nav?.breadcrumb ??
        (match.pathname === "/" ? "Home" : humanize(match.pathname)),
      href: match.pathname,
    }));

  if (items.length < 2) return null;

  return <BpBreadcrumbs items={items} />;
}
