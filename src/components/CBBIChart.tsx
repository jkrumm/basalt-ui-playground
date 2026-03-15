import { Button, ButtonGroup } from '@blueprintjs/core'
import { useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDateShort, formatYear } from '../lib/date'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryPoint { ts: number, price: number, confidence: number }

type ZoomKey = '6M' | '1Y' | '3Y' | '6Y' | 'ALL'

const ZOOM_DAYS: Record<ZoomKey, number> = {
  '6M': 180,
  '1Y': 365,
  '3Y': 3 * 365,
  '6Y': 6 * 365,
  'ALL': Infinity,
}

// Bitcoin halving timestamps (Unix seconds)
const HALVINGS = [
  { ts: 1354060800 }, // 2012-11-28
  { ts: 1468022400 }, // 2016-07-09
  { ts: 1589155200 }, // 2020-05-11
  { ts: 1713484800 }, // 2024-04-19
]

// ---------------------------------------------------------------------------
// CBBI rainbow color scale: dark green (0) → yellow → red → dark red (100)
// ---------------------------------------------------------------------------
function confidenceColor(value: number): string {
  const pct = Math.max(0, Math.min(100, value)) / 100
  const stops: Array<[number, [number, number, number]]> = [
    [0.0, [13, 61, 13]], // very dark green
    [0.15, [26, 122, 26]], // dark green
    [0.3, [74, 184, 74]], // medium green
    [0.45, [168, 216, 32]], // yellow-green
    [0.55, [245, 232, 0]], // yellow
    [0.65, [240, 128, 0]], // orange
    [0.75, [216, 48, 32]], // red
    [0.87, [160, 16, 16]], // dark red
    [1.0, [80, 8, 8]], // very dark red
  ]
  let lo = stops[0]!
  let hi = stops.at(-1)!
  for (let i = 0; i < stops.length - 1; i++) {
    if (pct >= stops[i]![0] && pct <= stops[i + 1]![0]) {
      lo = stops[i]!
      hi = stops[i + 1]!
      break
    }
  }
  const range = hi[0] - lo[0]
  const t = range === 0 ? 0 : (pct - lo[0]) / range
  const r = Math.round(lo[1][0] + t * (hi[1][0] - lo[1][0]))
  const g = Math.round(lo[1][1] + t * (hi[1][1] - lo[1][1]))
  const b = Math.round(lo[1][2] + t * (hi[1][2] - lo[1][2]))
  return `rgb(${r},${g},${b})`
}

// ---------------------------------------------------------------------------
// Axis formatters
// ---------------------------------------------------------------------------

function fmtPriceAxis(value: number): string {
  if (value >= 100_000)
    return `${Math.round(value / 1000)}k`
  if (value >= 1_000)
    return `${value / 1000}k`
  if (value >= 1)
    return String(Math.round(value))
  return ''
}

function fmtDateAxis(ts: number): string {
  return formatYear(ts)
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload }: { active?: boolean, payload?: Array<{ payload: HistoryPoint }> }) {
  if (!active || !payload?.length)
    return null
  const d = payload[0]!.payload
  return (
    <div
      style={{
        background: '#252a31',
        border: '1px solid #404854',
        borderRadius: 4,
        padding: '8px 12px',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <div style={{ color: '#8f99a8', marginBottom: 4 }}>
        {formatDateShort(d.ts)}
      </div>
      <div style={{ color: '#5b9bd5' }}>
        BTC $
        {d.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </div>
      <div style={{ color: confidenceColor(d.confidence) }}>
        CBBI
        {' '}
        {d.confidence.toFixed(1)}
        %
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

export function CBBIChart({ data }: { data: HistoryPoint[] }) {
  const [zoom, setZoom] = useState<ZoomKey>('ALL')

  const filteredData = useMemo(() => {
    if (zoom === 'ALL')
      return data
    // eslint-disable-next-line react-hooks/purity -- intentional: cutoff is relative to load/zoom time
    const cutoff = Date.now() / 1000 - ZOOM_DAYS[zoom] * 86400
    return data.filter(d => d.ts >= cutoff)
  }, [data, zoom])

  const visibleHalvings = useMemo(
    () => filteredData.length > 0
      ? HALVINGS.filter(
          h => h.ts >= filteredData[0]!.ts && h.ts <= filteredData.at(-1)!.ts,
        )
      : [],
    [filteredData],
  )

  return (
    <div>
      {/* Zoom controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <ButtonGroup>
          {(['6M', '1Y', '3Y', '6Y', 'ALL'] as ZoomKey[]).map(z => (
            <Button key={z} small text={z} active={zoom === z} onClick={() => setZoom(z)} />
          ))}
        </ButtonGroup>
        <span style={{ fontSize: 11, color: '#5f6b7c' }}>
          {filteredData.length}
          {' '}
          weekly data points · server-fetched, client-rendered
        </span>
      </div>

      <ResponsiveContainer width="100%" height={440}>
        <ComposedChart data={filteredData} margin={{ top: 8, right: 64, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c3a47" vertical={false} />

          <XAxis
            dataKey="ts"
            scale="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={fmtDateAxis}
            tick={{ fill: '#8f99a8', fontSize: 11 }}
            axisLine={{ stroke: '#2c3a47' }}
            tickLine={false}
            minTickGap={70}
          />

          {/* Left axis: CBBI confidence 0–100 */}
          <YAxis
            yAxisId="cbbi"
            domain={[0, 100]}
            tick={{ fill: '#8f99a8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />

          {/* Right axis: BTC price, log scale */}
          <YAxis
            yAxisId="price"
            orientation="right"
            scale="log"
            domain={['auto', 'auto']}
            tick={{ fill: '#e07020', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtPriceAxis}
            width={44}
          />

          {/* Halving reference lines */}
          {visibleHalvings.map(({ ts }) => (
            <ReferenceLine
              key={ts}
              x={ts}
              yAxisId="cbbi"
              stroke="#7c5cbf"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: 'H', fill: '#9b7fdb', fontSize: 9, position: 'insideBottomLeft' }}
            />
          ))}

          {/* BTC price — area on right axis */}
          <Area
            yAxisId="price"
            dataKey="price"
            type="monotone"
            fill="#1a3050"
            fillOpacity={0.7}
            stroke="#2d6ea0"
            strokeWidth={1}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />

          {/* CBBI confidence — individual colored dots, line hidden */}
          <Line
            yAxisId="cbbi"
            dataKey="confidence"
            stroke="transparent"
            strokeWidth={0}
            dot={(props: {
              cx?: number
              cy?: number
              payload?: HistoryPoint
              index?: number
            }) => {
              const { cx, cy, payload, index } = props
              if (cx == null || cy == null || !payload)
                return <g key={index} />
              return (
                <circle
                  key={`dot-${payload.ts}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={confidenceColor(payload.confidence)}
                  stroke="none"
                />
              )
            }}
            activeDot={false}
            isAnimationActive={false}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: '#404854', strokeWidth: 1 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Color legend */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 4, alignItems: 'center' }}>
        <span style={{ color: '#5f6b7c', fontSize: 11, marginRight: 6 }}>0</span>
        <div
          style={{
            width: 200,
            height: 10,
            borderRadius: 5,
            background: `linear-gradient(to right, ${
              [0, 15, 30, 45, 55, 65, 75, 87, 100]
                .map(v => confidenceColor(v))
                .join(', ')
            })`,
          }}
        />
        <span style={{ color: '#5f6b7c', fontSize: 11, marginLeft: 6 }}>100</span>
        <span style={{ color: '#5f6b7c', fontSize: 11, marginLeft: 16 }}>— CBBI dot color scale</span>
      </div>
    </div>
  )
}
