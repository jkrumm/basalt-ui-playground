import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Callout,
  Card,
  Code,
  Elevation,
  H3,
  H4,
  HTMLTable,
  Intent,
  ProgressBar,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { IconArrowDown, IconArrowsUpDown, IconArrowUp } from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { lazy, Suspense, useEffect, useState } from "react";
import { DefaultError } from "../components/DefaultError.tsx";
import { cbbiIndicatorsQuery } from "../queries/market.queries.ts";
import styles from "./table.module.css";

// Blueprint Table — lazy so it never runs on the server
const BPTableSection = lazy(() =>
  import("../components/BlueprintTableSection.tsx").then((m) => ({
    default: m.BlueprintTableSection,
  })),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IndicatorRow {
  key: string;
  name: string;
  description: string;
  value: number | null;
  zone: string;
}

const ZONE_LABELS = [
  "Deep Accumulation",
  "Accumulation",
  "Neutral",
  "Caution",
  "Distribution",
  "Market Top",
];

function intentOf(v: number | null): Intent {
  if (v === null) return Intent.NONE;
  if (v < 0.33) return Intent.SUCCESS;
  if (v < 0.66) return Intent.WARNING;
  return Intent.DANGER;
}

// ---------------------------------------------------------------------------
// Route — SSR pre-fetch via EdenTreaty
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/table")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(cbbiIndicatorsQuery());
  },
  errorComponent: ({ error, reset }) => <DefaultError error={error} reset={reset} />,
  component: TableComparison,
});

// ---------------------------------------------------------------------------
// TanStack Table columns
// ---------------------------------------------------------------------------

const COLUMNS: ColumnDef<IndicatorRow>[] = [
  {
    accessorKey: "name",
    header: "Indicator",
    cell: (info) => <strong>{info.getValue<string>()}</strong>,
  },
  {
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
    cell: (info) => (
      <span style={{ color: "var(--bp-typography-color-default-disabled)", fontSize: 12 }}>
        {info.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: (info) => {
      const v = info.getValue<number | null>();
      return (
        <Tag minimal intent={intentOf(v)}>
          {v !== null ? `${(v * 100).toFixed(1)}%` : "—"}
        </Tag>
      );
    },
  },
  {
    accessorKey: "zone",
    header: "Zone",
    sortingFn: (a, b) => {
      return ZONE_LABELS.indexOf(a.original.zone) - ZONE_LABELS.indexOf(b.original.zone);
    },
    cell: (info) => (
      <span style={{ fontSize: 13, color: "var(--bp-palette-gray-5)" }}>
        {info.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "value",
    id: "score",
    header: "Score",
    enableSorting: false,
    cell: (info) => {
      const v = info.getValue<number | null>();
      return (
        <ProgressBar
          value={v ?? 0}
          intent={intentOf(v)}
          animate={false}
          stripes={false}
          style={{ width: 120 }}
        />
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Sort icon helper
// ---------------------------------------------------------------------------
function SortIcon({ dir }: { dir: "asc" | "desc" | false }) {
  const className = dir ? styles.sortIconActive : styles.sortIcon;
  if (dir === "asc") return <IconArrowUp size={12} className={className} />;
  if (dir === "desc") return <IconArrowDown size={12} className={className} />;
  return <IconArrowsUpDown size={12} className={className} />;
}

// ---------------------------------------------------------------------------
// TanStack Table section — SSR-safe
// ---------------------------------------------------------------------------
function TanStackSection({ data }: { data: IndicatorRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns: COLUMNS,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card elevation={Elevation.ONE} style={{ padding: 0, overflow: "hidden" }}>
      <HTMLTable striped interactive style={{ width: "100%", margin: 0 }}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanSort() && <SortIcon dir={header.column.getIsSorted()} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function TableComparison() {
  const { data } = useSuspenseQuery(cbbiIndicatorsQuery());
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const rows: IndicatorRow[] = (data ?? []) as IndicatorRow[];

  return (
    <Box className={styles.page}>
      <Box className={styles.container}>
        {/* TanStack Table — SSR-safe */}
        <H3 style={{ marginTop: 0 }}>TanStack Table + Blueprint HTMLTable</H3>
        <Callout intent={Intent.SUCCESS} icon={null} style={{ marginBottom: 16 }}>
          <strong>SSR-safe</strong> — fully rendered in the initial HTML response. Use this on
          landing pages, docs, public dashboards. Produces semantic <Code>&lt;table&gt;</Code>{" "}
          markup that search engines index and screen readers navigate without JavaScript. TanStack
          Table is headless (zero DOM access) — you own the markup; Blueprint <Code>HTMLTable</Code>{" "}
          handles styling.
        </Callout>

        <TanStackSection data={rows} />

        {/* Blueprint Table — client-only */}
        <H3 style={{ marginTop: 40 }}>@blueprintjs/table</H3>
        <Callout intent={Intent.WARNING} icon={null} style={{ marginBottom: 16 }}>
          <strong>Client-only required</strong> — calls <Code>getBoundingClientRect()</Code> and
          manipulates <Code>scrollLeft</Code>/<Code>scrollTop</Code> during render. SSR crashes
          without an <Code>isMounted</Code> guard. Use this in authenticated dashboards where
          virtualized scrolling, frozen columns, and spreadsheet-style UX matter.
        </Callout>

        {isMounted ? (
          <Suspense
            fallback={
              <Card elevation={Elevation.ONE}>
                <Flex alignItems="center" justifyContent="center" style={{ height: 320 }}>
                  <Spinner size={40} />
                </Flex>
              </Card>
            }
          >
            <BPTableSection data={rows} />
          </Suspense>
        ) : (
          <Card elevation={Elevation.ONE}>
            <Flex alignItems="center" justifyContent="center" style={{ height: 320 }}>
              <Spinner size={40} />
            </Flex>
          </Card>
        )}

        {/* Decision guide */}
        <H4 style={{ marginTop: 40 }}>When to use which</H4>
        <HTMLTable bordered style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>TanStack Table + HTMLTable</th>
              <th>@blueprintjs/table</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["SSR / initial HTML", "Full semantic HTML", "Requires client-only guard"],
              ["SEO", "Table content indexed", "Not visible to crawlers"],
              [
                "Use case",
                "Public pages, docs, blogs, landing pages",
                "Authenticated SPAs, spreadsheet UX",
              ],
              ["Virtualization", "Add @tanstack/react-virtual", "Built-in (large datasets)"],
              ["Column resize / freeze", "Manual", "Built-in"],
              ["Sorting / filtering", "Built-in (headless)", "Built-in"],
              ["Styling control", "Full (you own the markup)", "Blueprint CSS only"],
              ["Bundle size", "~14 KB gzip", "Larger (virtualization engine)"],
            ].map(([dim, ts, bp]) => (
              <tr key={dim}>
                <td>
                  <strong>{dim}</strong>
                </td>
                <td style={{ fontSize: 13 }}>{ts}</td>
                <td style={{ fontSize: 13 }}>{bp}</td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      </Box>
    </Box>
  );
}
