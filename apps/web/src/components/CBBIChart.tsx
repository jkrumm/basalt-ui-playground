import { Button, ButtonGroup, NonIdealState } from "@blueprintjs/core";
import { TimelineAreaChart as TimelineAreaChartIcon } from "@blueprintjs/icons";
import { Flex } from "@blueprintjs/labs";
import { useMemo, useState } from "react";
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
} from "recharts";
import { EVENTS, track } from "../lib/analytics.ts";
import { formatDateShort, formatYear } from "../lib/date.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryPoint {
  ts: number;
  price: number;
  confidence: number;
}

type ZoomKey = "6M" | "1Y" | "3Y" | "6Y" | "ALL";

const ZOOM_DAYS: Record<ZoomKey, number> = {
  "6M": 180,
  "1Y": 365,
  "3Y": 3 * 365,
  "6Y": 6 * 365,
  ALL: Infinity,
};

// Chart color constants — aligned with Blueprint v6 design tokens.
// Recharts SVG props require raw hex (CSS custom properties don't work in SVG attributes).
const CHART = {
  tooltipBg: "#252a31", // --bp-palette-dark-gray-2
  tooltipBorder: "#404854", // --bp-palette-dark-gray-5
  grid: "#2c3a47", // custom — subtle chart gridline (darker than --bp-palette-dark-gray-3)
  tickMuted: "#8f99a8", // --bp-palette-gray-3
  tickPrice: "#e07020", // custom orange — price axis accent
  priceLine: "#2d6ea0", // custom blue — BTC price stroke
  priceFill: "#1a3050", // custom dark blue — BTC price area fill
  priceLabel: "#5b9bd5", // custom blue — tooltip price text
  halvingLine: "#7c5cbf", // custom violet — halving reference line
  halvingLabel: "#9b7fdb", // custom violet — halving "H" label
  cursor: "#404854", // --bp-palette-dark-gray-5
} as const;

// Bitcoin halving timestamps (Unix seconds)
const HALVINGS = [
  { ts: 1354060800 }, // 2012-11-28
  { ts: 1468022400 }, // 2016-07-09
  { ts: 1589155200 }, // 2020-05-11
  { ts: 1713484800 }, // 2024-04-19
];

// ---------------------------------------------------------------------------
// CBBI rainbow color scale: dark green (0) → yellow → red → dark red (100)
// ---------------------------------------------------------------------------
function confidenceColor(value: number): string {
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const stops: Array<[number, [number, number, number]]> = [
    [0.0, [13, 61, 13]],
    [0.15, [26, 122, 26]],
    [0.3, [74, 184, 74]],
    [0.45, [168, 216, 32]],
    [0.55, [245, 232, 0]],
    [0.65, [240, 128, 0]],
    [0.75, [216, 48, 32]],
    [0.87, [160, 16, 16]],
    [1.0, [80, 8, 8]],
  ];
  let lo = stops[0]!;
  let hi = stops.at(-1)!;
  for (let i = 0; i < stops.length - 1; i++) {
    if (pct >= stops[i]![0] && pct <= stops[i + 1]![0]) {
      lo = stops[i]!;
      hi = stops[i + 1]!;
      break;
    }
  }
  const range = hi[0] - lo[0];
  const t = range === 0 ? 0 : (pct - lo[0]) / range;
  const r = Math.round(lo[1][0] + t * (hi[1][0] - lo[1][0]));
  const g = Math.round(lo[1][1] + t * (hi[1][1] - lo[1][1]));
  const b = Math.round(lo[1][2] + t * (hi[1][2] - lo[1][2]));
  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------------------
// Axis formatters
// ---------------------------------------------------------------------------

function fmtPriceAxis(value: number): string {
  if (value >= 100_000) return `${Math.round(value / 1000)}k`;
  if (value >= 1_000) return `${value / 1000}k`;
  if (value >= 1) return String(Math.round(value));
  return "";
}

function fmtDateAxis(ts: number): string {
  return formatYear(ts);
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: HistoryPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  return (
    <div
      style={{
        background: "var(--bp-palette-dark-gray-2)",
        border: "1px solid var(--bp-palette-dark-gray-5)",
        borderRadius: "var(--bp-surface-border-radius)",
        padding: "8px 12px",
        fontSize: "var(--bp-typography-size-body-small)",
        lineHeight: 1.6,
      }}
    >
      <div style={{ color: "var(--bp-typography-color-default-disabled)", marginBottom: 4 }}>
        {formatDateShort(d.ts)}
      </div>
      <div style={{ color: CHART.priceLabel }}>
        BTC ${d.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </div>
      <div style={{ color: confidenceColor(d.confidence) }}>CBBI {d.confidence.toFixed(1)}%</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

export function CBBIChart({ data }: { data: HistoryPoint[] }) {
  const [zoom, setZoom] = useState<ZoomKey>("ALL");

  if (data.length === 0) {
    return <NonIdealState icon={<TimelineAreaChartIcon />} title="No chart data" />;
  }

  const filteredData = useMemo(() => {
    if (zoom === "ALL") return data;
    const cutoff = Date.now() / 1000 - ZOOM_DAYS[zoom] * 86400;
    return data.filter((d) => d.ts >= cutoff);
  }, [data, zoom]);

  const visibleHalvings = useMemo(
    () =>
      filteredData.length > 0
        ? HALVINGS.filter((h) => h.ts >= filteredData[0]!.ts && h.ts <= filteredData.at(-1)!.ts)
        : [],
    [filteredData],
  );

  return (
    <div>
      {/* Zoom controls */}
      <Flex justifyContent="space-between" alignItems="center" marginBottom={3}>
        <ButtonGroup>
          {(["6M", "1Y", "3Y", "6Y", "ALL"] as ZoomKey[]).map((z) => (
            <Button
              key={z}
              small
              text={z}
              active={zoom === z}
              onClick={() => {
                setZoom(z);
                track(EVENTS.TIMEFRAME_CHANGED, { component: "cbbi-chart", value: z });
              }}
            />
          ))}
        </ButtonGroup>
        <span style={{ fontSize: 11, color: "var(--bp-typography-color-muted)" }}>
          {filteredData.length} weekly data points · server-fetched, client-rendered
        </span>
      </Flex>

      <ResponsiveContainer width="100%" height={440}>
        <ComposedChart data={filteredData} margin={{ top: 8, right: 64, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />

          <XAxis
            dataKey="ts"
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmtDateAxis}
            tick={{ fill: CHART.tickMuted, fontSize: 11 }}
            axisLine={{ stroke: CHART.grid }}
            tickLine={false}
            minTickGap={70}
          />

          {/* Left axis: CBBI confidence 0–100 */}
          <YAxis
            yAxisId="cbbi"
            domain={[0, 100]}
            tick={{ fill: CHART.tickMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />

          {/* Right axis: BTC price, log scale */}
          <YAxis
            yAxisId="price"
            orientation="right"
            scale="log"
            domain={["auto", "auto"]}
            tick={{ fill: CHART.tickPrice, fontSize: 11 }}
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
              stroke={CHART.halvingLine}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: "H",
                fill: CHART.halvingLabel,
                fontSize: 9,
                position: "insideBottomLeft",
              }}
            />
          ))}

          {/* BTC price — area on right axis */}
          <Area
            yAxisId="price"
            dataKey="price"
            type="monotone"
            fill={CHART.priceFill}
            fillOpacity={0.7}
            stroke={CHART.priceLine}
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
            dot={(props: { cx?: number; cy?: number; payload?: HistoryPoint; index?: number }) => {
              const { cx, cy, payload, index } = props;
              if (cx == null || cy == null || !payload) return <g key={index} />;
              return (
                <circle
                  key={`dot-${payload.ts}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={confidenceColor(payload.confidence)}
                  stroke="none"
                />
              );
            }}
            activeDot={false}
            isAnimationActive={false}
          />

          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.cursor, strokeWidth: 1 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Color legend */}
      <Flex justifyContent="center" marginTop={3} gap={1} alignItems="center">
        <span style={{ color: "var(--bp-typography-color-muted)", fontSize: 11, marginRight: 6 }}>
          0
        </span>
        <div
          style={{
            width: 200,
            height: 10,
            borderRadius: 5,
            background: `linear-gradient(to right, ${[0, 15, 30, 45, 55, 65, 75, 87, 100]
              .map((v) => confidenceColor(v))
              .join(", ")})`,
          }}
        />
        <span style={{ color: "var(--bp-typography-color-muted)", fontSize: 11, marginLeft: 6 }}>
          100
        </span>
        <span style={{ color: "var(--bp-typography-color-muted)", fontSize: 11, marginLeft: 16 }}>
          — CBBI dot color scale
        </span>
      </Flex>
    </div>
  );
}
