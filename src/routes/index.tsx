import type { HistoryPoint } from '../components/CBBIChart'
import {
  Alignment,
  Button,
  ButtonGroup,
  Callout,
  Card,
  Divider,
  Elevation,
  H2,
  H5,
  HTMLSelect,
  HTMLTable,
  Intent,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  ProgressBar,
  Spinner,
  Tag,
  Tooltip,
} from '@blueprintjs/core'
import { Box, Flex } from '@blueprintjs/labs'
import {
  IconAlertTriangle,
  IconBook,
  IconCircleCheck,
  IconCircleX,
  IconFlame,
  IconInfoCircle,
  IconLayoutGrid,
  IconLayoutList,
  IconNews,
  IconTable,
} from '@tabler/icons-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { lazy, Suspense, useEffect, useState } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { ThemeToggle } from '../components/ThemeToggle'
import { EVENTS, track } from '../lib/analytics'
import { formatDateLong } from '../lib/date'
import styles from './index.module.css'

// Lazy-loaded: Recharts is ~300KB, no reason to include in SSR bundle.
// Combined with isMounted guard below, this is never executed on the server.
const CBBIChart = lazy(() =>
  import('../components/CBBIChart').then(m => ({ default: m.CBBIChart })),
)

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

const INDICATORS = {
  'PiCycle': {
    name: 'Pi Cycle Top',
    desc: 'Detects cycle tops via 111d / 350d moving-average crossover',
  },
  'RUPL': {
    name: 'RUPL',
    desc: 'Relative Unrealized Profit/Loss — overall market sentiment',
  },
  'RHODL': {
    name: 'RHODL Ratio',
    desc: 'Wealth distribution between short-term and long-term holders',
  },
  'Puell': {
    name: 'Puell Multiple',
    desc: 'Daily miner revenue vs 365-day average — miner profitability cycle',
  },
  '2YMA': {
    name: '2Y MA Multiplier',
    desc: 'Bitcoin price relative to its 2-year moving average',
  },
  'Trolololo': {
    name: 'Trolololo',
    desc: 'Bitcoin Rainbow Chart — logarithmic regression of long-run price',
  },
  'MVRV': {
    name: 'MVRV Z-Score',
    desc: 'Market cap vs Realized cap — detects statistical over/undervaluation',
  },
  'ReserveRisk': {
    name: 'Reserve Risk',
    desc: 'Long-term holder conviction relative to current price level',
  },
  'Woobull': {
    name: 'Woobull Top Cap',
    desc: 'Bitcoin price relative to Willy Woo\'s Top Cap model',
  },
} as const

type IndicatorKey = keyof typeof INDICATORS

type CBBIRaw = {
  Price: Record<string, number>
  Confidence: Record<string, number>
} & Record<IndicatorKey, Record<string, number | null>>

interface LatestSnapshot {
  date: string
  price: number
  confidence: number
  indicators: Record<IndicatorKey, number | null>
  // Weekly sampled history for the chart (every 7th day ≈ 767 points).
  // Not included in SSR HTML — chart renders client-only after hydration.
  history: HistoryPoint[]
}

// ---------------------------------------------------------------------------
// Server function
// ---------------------------------------------------------------------------

const getCBBIData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<LatestSnapshot> => {
    const res = await fetch('https://colintalkscrypto.com/cbbi/data/latest.json')
    if (!res.ok)
      throw new Error(`CBBI API returned ${res.status}`)

    const raw: CBBIRaw = await res.json()
    const timestamps = Object.keys(raw.Price).sort()
    const ts = timestamps.at(-1)
    if (!ts)
      throw new Error('No timestamps in CBBI data')

    // Weekly history for the chart (every 7th day → ~767 points)
    const history: HistoryPoint[] = timestamps
      .filter((_, i) => i % 7 === 0)
      .flatMap((t) => {
        const price = raw.Price[t]
        const conf = raw.Confidence[t]
        if (price == null || conf == null)
          return []
        return [{ ts: Number.parseInt(t), price, confidence: Math.round(conf * 1000) / 10 }]
      })

    return {
      date: formatDateLong(Number.parseInt(ts)),
      price: raw.Price[ts]!,
      confidence: raw.Confidence[ts]!,
      indicators: Object.fromEntries(
        (Object.keys(INDICATORS) as IndicatorKey[]).map(k => [
          k,
          raw[k]?.[ts] ?? null,
        ]),
      ) as Record<IndicatorKey, number | null>,
      history,
    }
  },
)

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/')({
  loader: () => getCBBIData(),
  component: CBBIDashboard,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getIntent(v: number): Intent {
  if (v < 0.33)
    return Intent.SUCCESS
  if (v < 0.66)
    return Intent.WARNING
  return Intent.DANGER
}

function getZoneLabel(v: number): string {
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

function fmtPct(v: number | null): string {
  return v !== null ? `${(v * 100).toFixed(1)}%` : '—'
}

function fmtPrice(v: number): string {
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// Blueprint's `icon` prop accepts `IconName | MaybeElement` where
// MaybeElement = React.JSX.Element | false | null | undefined.
// Tabler icon components are valid React elements — full drop-in.
function getCalloutConfig(confidence: number): {
  intent: Intent
  icon: React.JSX.Element
  title: string
  message: string
} {
  if (confidence < 0.2) {
    return {
      intent: Intent.SUCCESS,
      icon: <IconCircleCheck size={16} />,
      title: 'Deep Accumulation Zone',
      message:
        'On-chain metrics are at historically low levels. Bitcoin has traded in this range during early cycle phases and post-crash recoveries. Risk/reward is historically favorable.',
    }
  }
  if (confidence < 0.4) {
    return {
      intent: Intent.SUCCESS,
      icon: <IconCircleCheck size={16} />,
      title: 'Accumulation Zone',
      message:
        'Below the neutral midpoint. On-chain data reflects mid-cycle consolidation with no overheating signals. Historically a reasonable entry window before the next expansion phase.',
    }
  }
  if (confidence < 0.6) {
    return {
      intent: Intent.PRIMARY,
      icon: <IconInfoCircle size={16} />,
      title: 'Neutral — Mid Cycle',
      message:
        'No strong directional signal. The market is transitioning between accumulation and distribution phases. On-chain data is balanced.',
    }
  }
  if (confidence < 0.75) {
    return {
      intent: Intent.WARNING,
      icon: <IconAlertTriangle size={16} />,
      title: 'Caution — Cycle Heating Up',
      message:
        'Multiple indicators are elevating. Historically, this range precedes the later stages of a bull cycle. Consider managing position size.',
    }
  }
  if (confidence < 0.9) {
    return {
      intent: Intent.DANGER,
      icon: <IconFlame size={16} />,
      title: 'Distribution Zone',
      message:
        'Strong on-chain sell signal across multiple metrics. Historical Bitcoin cycle tops have occurred in this range. Exercise caution with new exposure.',
    }
  }
  return {
    intent: Intent.DANGER,
    icon: <IconCircleX size={16} />,
    title: 'Market Top Territory',
    message:
      'Extreme readings across all indicators. Every prior Bitcoin cycle top has occurred at CBBI levels above 0.9. Historical data suggests extreme caution.',
  }
}

function getSortedKeys(
  indicators: Record<IndicatorKey, number | null>,
  sortBy: string,
): IndicatorKey[] {
  const keys = Object.keys(INDICATORS) as IndicatorKey[]
  if (sortBy === 'value-asc')
    return keys.toSorted((a, b) => (indicators[a] ?? -1) - (indicators[b] ?? -1))
  if (sortBy === 'value-desc')
    return keys.toSorted((a, b) => (indicators[b] ?? -1) - (indicators[a] ?? -1))
  return keys
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CBBIDashboard() {
  const { price, confidence, indicators, history } = Route.useLoaderData()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sortBy, setSortBy] = useState('default')
  // Chart is client-only: useEffect never runs on server, so isMounted
  // stays false during SSR — Recharts never touches document/window.
  const [isMounted, setIsMounted] = useState(false)
  // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect, react-hooks/set-state-in-effect
  useEffect(() => setIsMounted(true), [])

  const callout = getCalloutConfig(confidence)
  const sortedKeys = getSortedKeys(indicators, sortBy)

  return (
    <PageLayout>
      <Box className={styles.page}>
        {/* ------------------------------------------------------------------ */}
        {/* Navbar — Button, Divider                                            */}
        {/* ------------------------------------------------------------------ */}
        <Navbar style={{ position: 'sticky', top: 0, zIndex: 20 }}>
          <NavbarGroup align={Alignment.START}>
            <NavbarHeading>
              <strong>CBBI</strong>
              {' '}
              Dashboard
            </NavbarHeading>
            <Divider />
            {/* Dialog trigger — Portal component test #1 */}
            <Link to="/table" style={{ textDecoration: 'none' }}>
              <Button variant="minimal" icon={<IconTable size={16} />} text="Tables" />
            </Link>
            <Link to="/blog" search={{ tag: '' }} style={{ textDecoration: 'none' }}>
              <Button variant="minimal" icon={<IconNews size={16} />} text="Blog" />
            </Link>
            <Link to="/docs" style={{ textDecoration: 'none' }}>
              <Button variant="minimal" icon={<IconBook size={16} />} text="Docs" />
            </Link>
          </NavbarGroup>
          <NavbarGroup align={Alignment.END}>
            <Tag large>
              BTC $
              {fmtPrice(price)}
            </Tag>
            <Divider />
            <ThemeToggle />
          </NavbarGroup>
        </Navbar>

        <Box className={styles.container}>
          {/* ---------------------------------------------------------------- */}
          {/* Confidence card                                                   */}
          {/* ---------------------------------------------------------------- */}
          <Card elevation={Elevation.TWO} style={{ marginBottom: 16 }}>
            <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
              <H2 style={{ margin: 0 }}>Confidence Score</H2>
              <Flex gap={2} alignItems="center">
                <Tag large intent={getIntent(confidence)}>
                  {getZoneLabel(confidence)}
                </Tag>
                <Tag large minimal>
                  {fmtPct(confidence)}
                </Tag>
              </Flex>
            </Flex>
            <ProgressBar
              value={confidence}
              intent={getIntent(confidence)}
              animate={false}
              stripes={false}
              style={{ height: 12 }}
            />
            <p className="cbbi-meta" style={{ marginTop: 10 }}>
              Composite of 9 on-chain indicators. Low = accumulation zone &mdash; High
              = distribution / approaching cycle top.
            </p>
          </Card>

          {/* ---------------------------------------------------------------- */}
          {/* Callout — intent, icon, title                                     */}
          {/* ---------------------------------------------------------------- */}
          <Callout
            intent={callout.intent}
            icon={callout.icon}
            title={callout.title}
            style={{ marginBottom: 24 }}
          >
            {callout.message}
          </Callout>

          {/* ---------------------------------------------------------------- */}
          {/* Controls — ButtonGroup, HTMLSelect                                */}
          {/* ---------------------------------------------------------------- */}
          <Flex justifyContent="space-between" alignItems="center" marginBottom={4} gap={2} flexWrap="wrap">
            <ButtonGroup>
              <Button
                icon={<IconLayoutGrid size={16} />}
                text="Grid"
                active={viewMode === 'grid'}
                onClick={() => {
                  setViewMode('grid')
                  track(EVENTS.VIEW_TOGGLED, { component: 'indicator-grid', view: 'grid' })
                }}
              />
              <Button
                icon={<IconLayoutList size={16} />}
                text="Table"
                active={viewMode === 'table'}
                onClick={() => {
                  setViewMode('table')
                  track(EVENTS.VIEW_TOGGLED, { component: 'indicator-grid', view: 'table' })
                }}
              />
            </ButtonGroup>

            <HTMLSelect
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                track(EVENTS.SELECT_CHANGED, { component: 'indicator-grid', field: 'sort', value: e.target.value })
              }}
              options={[
                { label: 'Default order', value: 'default' },
                { label: 'Value: Low → High', value: 'value-asc' },
                { label: 'Value: High → Low', value: 'value-desc' },
              ]}
            />
          </Flex>

          {/* ---------------------------------------------------------------- */}
          {/* Grid view — Card, Tooltip (Portal), ProgressBar, Tag             */}
          {/* ---------------------------------------------------------------- */}
          {viewMode === 'grid' && (
            <div className={styles.grid}>
              {sortedKeys.map((key) => {
                const { name, desc } = INDICATORS[key]
                const value = indicators[key]
                return (
                  <Card key={key} elevation={Elevation.ONE}>
                    <Flex flexDirection="column" gap={2}>
                      <Flex justifyContent="space-between" alignItems="start">
                        {/* Tooltip wraps the heading — Portal-based, SSR test */}
                        <Tooltip content={desc} placement="top" compact>
                          <H5 style={{ margin: 0, cursor: 'help' }}>{name}</H5>
                        </Tooltip>
                        <Tag
                          minimal
                          intent={value !== null ? getIntent(value) : Intent.NONE}
                        >
                          {fmtPct(value)}
                        </Tag>
                      </Flex>
                      <ProgressBar
                        value={value ?? 0}
                        intent={value !== null ? getIntent(value) : Intent.NONE}
                        animate={false}
                        stripes={false}
                      />
                    </Flex>
                  </Card>
                )
              })}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Table view — HTMLTable, Tag, ProgressBar                         */}
          {/* ---------------------------------------------------------------- */}
          {viewMode === 'table' && (
            <Card elevation={Elevation.ONE} style={{ padding: 0, overflow: 'hidden' }}>
              <HTMLTable striped interactive style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Indicator</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Value</th>
                    <th>Zone</th>
                    <th style={{ width: 140 }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedKeys.map((key) => {
                    const { name, desc } = INDICATORS[key]
                    const value = indicators[key]
                    return (
                      <tr key={key}>
                        <td>
                          <strong>{name}</strong>
                        </td>
                        <td className="cbbi-meta" style={{ maxWidth: 280 }}>
                          {desc}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Tag
                            minimal
                            intent={value !== null ? getIntent(value) : Intent.NONE}
                          >
                            {fmtPct(value)}
                          </Tag>
                        </td>
                        <td style={{ color: '#8f99a8', fontSize: 13 }}>
                          {value !== null ? getZoneLabel(value) : '—'}
                        </td>
                        <td>
                          <ProgressBar
                            value={value ?? 0}
                            intent={value !== null ? getIntent(value) : Intent.NONE}
                            animate={false}
                            stripes={false}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </HTMLTable>
            </Card>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Historical chart — client-only (isMounted guard + React.lazy)   */}
          {/*                                                                   */}
          {/* Why client-only?                                                  */}
          {/*   1. 767 SVG elements would bloat SSR HTML for zero SEO gain     */}
          {/*   2. Recharts (~300KB) excluded from server bundle                */}
          {/*   3. Data IS server-fetched (in loader) — only rendering deferred */}
          {/* ---------------------------------------------------------------- */}
          <Card elevation={Elevation.TWO} style={{ marginTop: 24, marginBottom: 24 }}>
            <H2 style={{ margin: '0 0 4px' }}>Historical Chart</H2>
            <p className="cbbi-meta" style={{ marginBottom: 16 }}>
              Weekly Bitcoin price (right axis, log scale) with CBBI confidence dots colored by cycle position.
            </p>
            {isMounted
              ? (
                  <Suspense
                    fallback={(
                      <Flex alignItems="center" justifyContent="center" className={styles.spinnerContainer}>
                        <Spinner size={40} />
                      </Flex>
                    )}
                  >
                    <CBBIChart data={history} />
                  </Suspense>
                )
              : (
            // Server render + first client paint: show spinner placeholder.
            // Height is fixed so layout doesn't shift after hydration.
                  <Flex alignItems="center" justifyContent="center" className={styles.spinnerContainer}>
                    <Spinner size={40} />
                  </Flex>
                )}
          </Card>

          {/* Source */}
          <p className="cbbi-source">
            Data:
            {' '}
            <a href="https://colintalkscrypto.com/cbbi">colintalkscrypto.com/cbbi</a>
            {' · '}
            <a href="https://github.com/Zaczero/CBBI">CBBI algorithm</a>
          </p>
        </Box>
      </Box>
    </PageLayout>
  )
}
