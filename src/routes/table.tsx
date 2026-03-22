import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { Callout, Card, Code, Elevation, H3, H4, HTMLTable, Intent, ProgressBar, Spinner, Tag } from '@blueprintjs/core'
import { Box, Flex } from '@blueprintjs/labs'
import { IconArrowDown, IconArrowsUpDown, IconArrowUp } from '@tabler/icons-react'
/**
 * Table Comparison Route — /table
 *
 * Demonstrates two fundamentally different table approaches and their
 * SSR characteristics in TanStack Start:
 *
 * 1. TanStack Table (headless) + Blueprint HTMLTable
 *    → Fully SSR-rendered. Use on landing pages, docs, public dashboards.
 *    → Produces semantic <table> HTML → indexable, accessible on first paint.
 *
 * 2. @blueprintjs/table (Table component)
 *    → Client-only. Calls getBoundingClientRect() during render.
 *    → Use in authenticated SPAs, spreadsheet-like UX, large virtualised grids.
 */
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {

  flexRender,
  getCoreRowModel,
  getSortedRowModel,

  useReactTable,
} from '@tanstack/react-table'
import {

  lazy,
  Suspense,
  useEffect,
  useState,
} from 'react'
import styles from './table.module.css'

// ---------------------------------------------------------------------------
// Blueprint Table — lazy so it never runs on the server
// ---------------------------------------------------------------------------
const BPTableSection = lazy(() =>
  import('../components/BlueprintTableSection').then(m => ({
    default: m.BlueprintTableSection,
  })),
)

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export interface IndicatorRow {
  key: string
  name: string
  desc: string
  value: number | null
  zone: string
}

const ZONE_LABELS = ['Deep Accumulation', 'Accumulation', 'Neutral', 'Caution', 'Distribution', 'Market Top']

function zoneOf(v: number | null): string {
  if (v === null)
    return '—'
  if (v < 0.2)
    return 'Deep Accumulation'
  if (v < 0.4)
    return 'Accumulation'
  if (v < 0.6)
    return 'Neutral'
  if (v < 0.75)
    return 'Caution'
  if (v < 0.9)
    return 'Distribution'
  return 'Market Top'
}

function intentOf(v: number | null): Intent {
  if (v === null)
    return Intent.NONE
  if (v < 0.33)
    return Intent.SUCCESS
  if (v < 0.66)
    return Intent.WARNING
  return Intent.DANGER
}

const getTableData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<IndicatorRow[]> => {
    const res = await fetch('https://colintalkscrypto.com/cbbi/data/latest.json')
    const raw = await res.json()
    const timestamps = Object.keys(raw.Price).sort()
    const ts = timestamps.at(-1)
    if (!ts)
      throw new Error('No timestamps in CBBI data')

    const META: Record<string, { name: string, desc: string }> = {
      'PiCycle': { name: 'Pi Cycle Top', desc: 'Detects cycle tops via 111d / 350d MA crossover' },
      'RUPL': { name: 'RUPL', desc: 'Relative Unrealized Profit/Loss' },
      'RHODL': { name: 'RHODL Ratio', desc: 'Wealth distribution: old vs new coins' },
      'Puell': { name: 'Puell Multiple', desc: 'Miner revenue vs 365-day average' },
      '2YMA': { name: '2Y MA Multiplier', desc: 'Price relative to 2-year moving average' },
      'Trolololo': { name: 'Trolololo', desc: 'Bitcoin Rainbow Chart log regression' },
      'MVRV': { name: 'MVRV Z-Score', desc: 'Market cap vs Realized cap' },
      'ReserveRisk': { name: 'Reserve Risk', desc: 'Long-term holder conviction vs price' },
      'Woobull': { name: 'Woobull Top Cap', desc: 'Price vs Willy Woo\'s Top Cap model' },
      'Confidence': { name: 'CBBI Confidence', desc: 'Composite of all 9 indicators' },
    }

    return Object.entries(META).map(([key, { name, desc }]) => {
      const v = raw[key]?.[ts] ?? null
      return { key, name, desc, value: v, zone: zoneOf(v) }
    })
  },
)

export const Route = createFileRoute('/table')({
  loader: () => getTableData(),
  component: TableComparison,
})

// ---------------------------------------------------------------------------
// TanStack Table columns
// ---------------------------------------------------------------------------

const COLUMNS: ColumnDef<IndicatorRow>[] = [
  {
    accessorKey: 'name',
    header: 'Indicator',
    cell: info => <strong>{info.getValue<string>()}</strong>,
  },
  {
    accessorKey: 'desc',
    header: 'Description',
    enableSorting: false,
    cell: info => (
      <span style={{ color: '#8f99a8', fontSize: 12 }}>{info.getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: (info) => {
      const v = info.getValue<number | null>()
      return (
        <Tag minimal intent={intentOf(v)}>
          {v !== null ? `${(v * 100).toFixed(1)}%` : '—'}
        </Tag>
      )
    },
  },
  {
    accessorKey: 'zone',
    header: 'Zone',
    sortingFn: (a, b) => {
      return ZONE_LABELS.indexOf(a.original.zone) - ZONE_LABELS.indexOf(b.original.zone)
    },
    cell: info => (
      <span style={{ fontSize: 13, color: '#c5cbd3' }}>{info.getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'value',
    id: 'score',
    header: 'Score',
    enableSorting: false,
    cell: (info) => {
      const v = info.getValue<number | null>()
      return (
        <ProgressBar
          value={v ?? 0}
          intent={intentOf(v)}
          animate={false}
          stripes={false}
          style={{ width: 120 }}
        />
      )
    },
  },
]

// ---------------------------------------------------------------------------
// Sort icon helper
// ---------------------------------------------------------------------------
function SortIcon({ dir }: { dir: 'asc' | 'desc' | false }) {
  const className = dir ? styles.sortIconActive : styles.sortIcon
  if (dir === 'asc')
    return <IconArrowUp size={12} className={className} />
  if (dir === 'desc')
    return <IconArrowDown size={12} className={className} />
  return <IconArrowsUpDown size={12} className={className} />
}

// ---------------------------------------------------------------------------
// TanStack Table section — SSR-safe
// ---------------------------------------------------------------------------
function TanStackSection({ data }: { data: IndicatorRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([])

  // TanStack Table v8 returns functions with unstable references each render —
  // React Compiler correctly skips memoizing this component. No workaround
  // until TanStack Table ships compiler-compatible APIs.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: COLUMNS,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Card elevation={Elevation.ONE} style={{ padding: 0, overflow: 'hidden' }}>
      <HTMLTable striped interactive style={{ width: '100%', margin: 0 }}>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  style={{
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanSort() && (
                    <SortIcon dir={header.column.getIsSorted()} />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function TableComparison() {
  const data = Route.useLoaderData()
  const [isMounted, setIsMounted] = useState(false)
  // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect, react-hooks/set-state-in-effect
  useEffect(() => setIsMounted(true), [])

  return (
    <Box className={styles.page}>
      <Box className={styles.container}>

        {/* ---------------------------------------------------------------- */}
        {/* 1. TanStack Table — SSR-safe                                      */}
        {/* ---------------------------------------------------------------- */}
        <H3 style={{ marginTop: 0 }}>TanStack Table + Blueprint HTMLTable</H3>
        <Callout intent={Intent.SUCCESS} icon={null} style={{ marginBottom: 16 }}>
          <strong>SSR-safe</strong>
          {' '}
          — fully rendered in the initial HTML response.
          Use this on landing pages, docs, public dashboards. Produces semantic
          {' '}
          <Code>&lt;table&gt;</Code>
          {' '}
          markup that search engines index and screen readers
          navigate without JavaScript. TanStack Table is headless (zero DOM access) —
          you own the markup; Blueprint
          <Code>HTMLTable</Code>
          {' '}
          handles styling.
        </Callout>

        <TanStackSection data={data} />

        {/* ---------------------------------------------------------------- */}
        {/* 2. Blueprint Table — client-only                                  */}
        {/* ---------------------------------------------------------------- */}
        <H3 style={{ marginTop: 40 }}>@blueprintjs/table</H3>
        <Callout intent={Intent.WARNING} icon={null} style={{ marginBottom: 16 }}>
          <strong>Client-only required</strong>
          {' '}
          — calls
          {' '}
          <Code>getBoundingClientRect()</Code>
          {' '}
          and manipulates
          <Code>scrollLeft</Code>
          /
          <Code>scrollTop</Code>
          {' '}
          during render. SSR crashes without an
          {' '}
          <Code>isMounted</Code>
          {' '}
          guard. Use this in authenticated dashboards where
          virtualized scrolling, frozen columns, and spreadsheet-style UX matter.
          SEO is irrelevant behind auth.
        </Callout>

        {isMounted
          ? (
              <Suspense
                fallback={(
                  <Card elevation={Elevation.ONE}>
                    <Flex alignItems="center" justifyContent="center" style={{ height: 320 }}>
                      <Spinner size={40} />
                    </Flex>
                  </Card>
                )}
              >
                <BPTableSection data={data} />
              </Suspense>
            )
          : (
              <Card elevation={Elevation.ONE}>
                <Flex alignItems="center" justifyContent="center" style={{ height: 320 }}>
                  <Spinner size={40} />
                </Flex>
              </Card>
            )}

        {/* ---------------------------------------------------------------- */}
        {/* Decision guide                                                    */}
        {/* ---------------------------------------------------------------- */}
        <H4 style={{ marginTop: 40 }}>When to use which</H4>
        <HTMLTable bordered style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>TanStack Table + HTMLTable</th>
              <th>@blueprintjs/table</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['SSR / initial HTML', '✅ Full semantic HTML', '❌ Requires client-only guard'],
              ['SEO', '✅ Table content indexed', '❌ Not visible to crawlers'],
              ['Use case', 'Public pages, docs, blogs, landing pages', 'Authenticated SPAs, spreadsheet UX'],
              ['Virtualization', '❌ Add @tanstack/react-virtual', '✅ Built-in (large datasets)'],
              ['Column resize / freeze', '❌ Manual', '✅ Built-in'],
              ['Sorting / filtering', '✅ Built-in (headless)', '✅ Built-in'],
              ['Styling control', '✅ Full (you own the markup)', '⚠️ Blueprint CSS only'],
              ['Bundle size', '~14 KB gzip', 'Larger (virtualization engine)'],
            ].map(([dim, ts, bp]) => (
              <tr key={dim}>
                <td><strong>{dim}</strong></td>
                <td style={{ fontSize: 13 }}>{ts}</td>
                <td style={{ fontSize: 13 }}>{bp}</td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>

      </Box>
    </Box>
  )
}
