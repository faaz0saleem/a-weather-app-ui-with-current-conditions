"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Hand-rolled SVG charts (no chart library): thin marks, 4px rounded data
 * ends, 2px surface gaps, hairline solid grid, hover + focus tooltips, and a
 * table view for every chart. Colours come from validated tokens.
 */

const niceMax = (v: number) => {
  if (v <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

export type Series = { key: string; label: string; color: string };

/** Stacked columns over an ordinal x (e.g. hours). One y-axis, legend + tooltip + table. */
export function StackedColumns({
  data,
  series,
  xLabel,
  tooltip,
  height = 220,
}: {
  data: { x: string; values: Record<string, number>; note?: string }[];
  series: Series[];
  xLabel: (x: string, i: number) => string | null;
  tooltip: (d: { x: string; values: Record<string, number>; note?: string }) => React.ReactNode;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const pad = { l: 36, r: 8, t: 10, b: 24 };
  const innerW = W - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const totals = data.map((d) => series.reduce((s, se) => s + (d.values[se.key] ?? 0), 0));
  const max = niceMax(Math.max(1, ...totals));
  const band = innerW / Math.max(1, data.length);
  const barW = Math.min(24, band * 0.62);
  const ticks = [0, max / 2, max];
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={`Column chart: ${series.map((s) => s.label).join(" and ")} by ${data.length} categories. Use the Table button for the numbers.`}>
        {ticks.map((tv) => (
          <g key={tv}>
            <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="var(--wp-line)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(tv) + 4} textAnchor="end" className="fill-ink-soft text-[11px] tabular-nums">
              {Math.round(tv).toLocaleString("en-US")}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.l + band * i + band / 2;
          let acc = 0;
          const segs = series
            .map((se) => ({ se, v: d.values[se.key] ?? 0 }))
            .filter((s) => s.v > 0);
          return (
            <g
              key={d.x}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect x={pad.l + band * i} y={pad.t} width={band} height={innerH} fill="transparent" />
              {segs.map(({ se, v }, si) => {
                const y0 = y(acc);
                acc += v;
                const y1 = y(acc);
                const top = si === segs.length - 1;
                const h = Math.max(0, y0 - y1 - (si > 0 ? 2 : 0));
                return top ? (
                  <path
                    key={se.key}
                    d={roundedTop(cx - barW / 2, y1, barW, h, Math.min(4, h, barW / 2))}
                    fill={se.color}
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                ) : (
                  <rect key={se.key} x={cx - barW / 2} y={y1 + 2} width={barW} height={h} fill={se.color} opacity={hover === null || hover === i ? 1 : 0.55} />
                );
              })}
              {xLabel(d.x, i) && (
                <text x={cx} y={height - 6} textAnchor="middle" className="fill-ink-soft text-[11px]">
                  {xLabel(d.x, i)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="var(--wp-inkSoft)" strokeOpacity={0.4} strokeWidth={1} />
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-xs text-cream shadow-lift"
          style={{ left: `${((pad.l + band * hover + band / 2) / W) * 100}%` }}
        >
          {tooltip(data[hover])}
        </div>
      )}
      <Legend series={series} />
    </div>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

export function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-4 text-xs text-ink-soft">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** Horizontal bars with the category and value labels always visible (identity never colour-only). */
export function HBars({ rows }: { rows: { label: string; value: number; color: string; display: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-semibold text-ink">{r.label}</span>
            <span className="tabular text-ink-soft">{r.display}</span>
          </div>
          <div className="h-3 w-full rounded-r bg-muted">
            <div className={cn("h-full rounded-r-[4px]")} style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
