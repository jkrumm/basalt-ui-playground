import { Button, ButtonGroup, NonIdealState } from "@blueprintjs/core";
import { TimelineAreaChart as TimelineAreaChartIcon } from "@blueprintjs/icons";
import { Flex } from "@blueprintjs/labs";
import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
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

export interface IndicatorHistoryPoint {
  timestamp: number;
  price: number;
  value: number | null;
}

type ZoomKey = "6M" | "1Y" | "3Y" | "6Y" | "ALL";

const ZOOM_DAYS: Record<ZoomKey, number> = {
  "6M": 180,
  "1Y": 365,
  "3Y": 3 * 365,
  "6Y": 6 * 365,
  ALL: Infinity,
};

// Same hex constants as CBBIChart — CSS vars don't work in SVG attributes
const CHART = {
  grid: "#2c3a47",
  tickMuted: "#8f99a8",
  tickPrice: "#e07020",
  priceLine: "#2d6ea0",
  priceFill: "#1a3050",
  priceLabel: "#5b9bd5",
  indicatorLine: "#a855f7",
  cursor: "#404854",
} as const;

// ---------------------------------------------------------------------------
// Axis formatters
// ---------------------------------------------------------------------------

function fmtPriceAxis(value: number): string {
  if (value >= 100_000) return `${Math.round(value / 1000)}k`;
  if (value >= 1_000) return `${value / 1000}k`;
  return String(Math.round(value));
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IndicatorHistoryPoint }>;
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
        {formatDateShort(d.timestamp)}
      </div>
      <div style={{ color: CHART.priceLabel }}>
        BTC ${d.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </div>
      {d.value !== null && (
        <div style={{ color: CHART.indicatorLine }}>{(d.value * 100).toFixed(1)}%</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

export function IndicatorChart({ data }: { data: IndicatorHistoryPoint[] }) {
  const [zoom, setZoom] = useState<ZoomKey>("ALL");

  if (data.length === 0) {
    return <NonIdealState icon={<TimelineAreaChartIcon />} title="No chart data" />;
  }

  const filteredData = useMemo(() => {
    if (zoom === "ALL") return data;
    const cutoff = Date.now() / 1000 - ZOOM_DAYS[zoom] * 86400;
    return data.filter((d) => d.timestamp >= cutoff);
  }, [data, zoom]);

  return (
    <div>
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
                track(EVENTS.TIMEFRAME_CHANGED, { component: "indicator-chart", value: z });
              }}
            />
          ))}
        </ButtonGroup>
        <span style={{ fontSize: 11, color: "var(--bp-typography-color-muted)" }}>
          {filteredData.length} weekly data points
        </span>
      </Flex>

      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={filteredData} margin={{ top: 8, right: 64, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />

          <XAxis
            dataKey="timestamp"
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts: number) => formatYear(ts)}
            tick={{ fill: CHART.tickMuted, fontSize: 11 }}
            axisLine={{ stroke: CHART.grid }}
            tickLine={false}
            minTickGap={70}
          />

          {/* Left axis: indicator value 0–100% */}
          <YAxis
            yAxisId="indicator"
            domain={[0, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            tick={{ fill: CHART.tickMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
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

          {/* Indicator value — purple line on left axis */}
          <Line
            yAxisId="indicator"
            dataKey="value"
            type="monotone"
            stroke={CHART.indicatorLine}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
            connectNulls={false}
          />

          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.cursor, strokeWidth: 1 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
