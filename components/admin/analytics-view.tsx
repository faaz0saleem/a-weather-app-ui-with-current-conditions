"use client";

import { useEffect, useState } from "react";
import { Table2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/client/api";
import { formatPKR } from "@/lib/format";
import type { AnalyticsReport } from "@/lib/server/admin";
import { cn } from "@/lib/utils";
import { AdminHeader } from "./admin-shell";
import { HBars, StackedColumns } from "./charts";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
] as const;

const hourLabel = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);

export function AnalyticsView({ initial }: { initial: AnalyticsReport }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("7d");
  const [sim, setSim] = useState(false);
  const [report, setReport] = useState<AnalyticsReport | null>(initial);
  const [showTable, setShowTable] = useState(false);
  const [key, setKey] = useState("7d:0");

  useEffect(() => {
    const k = `${range}:${sim ? 1 : 0}`;
    if (k === key) return;
    let cancelled = false;
    api<{ report: AnalyticsReport }>(`/api/admin/analytics?range=${range}&sim=${sim ? 1 : 0}`)
      .then((r) => {
        if (cancelled) return;
        setReport(r.report);
        setKey(k);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [range, sim, key]);

  const loading = key !== `${range}:${sim ? 1 : 0}`;
  const r = report;
  const hours = Array.from({ length: 24 }, (_, h) => {
    const row = r?.by_hour.find((x) => x.hour === h);
    return { x: String(h), values: { ok: (row?.orders ?? 0) - (row?.late ?? 0), late: row?.late ?? 0 }, note: row?.avg_min != null ? `avg ${row.avg_min} min` : undefined };
  });
  const causes = r?.lates_by_cause ?? {};
  const lateTotal = Object.values(causes).reduce((a, b) => a + b, 0);

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Delivery time = order placed → rider tapped Arrived (the guarantee clock). Times in Asia/Karachi." />

      {/* Filters: one row, above the charts */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-2xl bg-muted p-1" role="tablist" aria-label="Date range">
          {RANGES.map((rg) => (
            <button
              key={rg.key}
              role="tab"
              aria-selected={range === rg.key}
              onClick={() => setRange(rg.key)}
              className={cn("h-9 rounded-xl px-4 text-sm font-semibold", range === rg.key ? "bg-card shadow-soft" : "text-ink-soft")}
            >
              {rg.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <Switch checked={sim} onCheckedChange={setSim} /> Include test orders
        </label>
      </div>

      {!r || loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Orders" value={r.orders.toLocaleString("en-US")} sub={`${r.delivered} delivered · ${r.rejected} rejected · ${r.timeouts} timed out`} />
            <Stat label="Avg delivery" value={r.avg_delivery_min != null ? `${r.avg_delivery_min} min` : "—"} sub="placed → arrived" />
            <Stat label="On time" value={r.on_time_pct != null ? `${r.on_time_pct}%` : "—"} sub="of guaranteed orders" tone={r.on_time_pct != null && r.on_time_pct < 90 ? "bad" : "good"} />
            <Stat label="Free orders" value={String(r.free_orders)} sub={`cost ${formatPKR(r.free_cost_pkr)}`} tone={r.free_orders ? "bad" : undefined} />
            <Stat label="Charged to kitchens" value={formatPKR(r.kitchen_charges_pkr)} sub="kitchen-caused lates" />
            <Stat label="GMV" value={formatPKR(r.gmv_pkr)} sub={`${r.flagged_arrivals} GPS-flagged arrivals`} />
          </div>

          <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Orders by hour</h2>
                <button onClick={() => setShowTable((v) => !v)} className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink">
                  <Table2 className="size-4" /> {showTable ? "Chart" : "Table"}
                </button>
              </div>
              {showTable ? (
                <table className="tabular w-full text-sm">
                  <thead className="text-left text-xs text-ink-soft">
                    <tr>
                      <th className="py-1">Hour</th>
                      <th>Orders</th>
                      <th>Late</th>
                      <th>Avg min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.by_hour.map((h) => (
                      <tr key={h.hour} className="border-t border-line">
                        <td className="py-1">{hourLabel(h.hour)}</td>
                        <td>{h.orders}</td>
                        <td>{h.late}</td>
                        <td>{h.avg_min ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <StackedColumns
                  data={hours}
                  series={[
                    { key: "ok", label: "On time / other", color: "var(--wp-chartB)" },
                    { key: "late", label: "Late (free)", color: "var(--wp-chili)" },
                  ]}
                  xLabel={(x, i) => (i % 3 === 0 ? hourLabel(Number(x)) : null)}
                  tooltip={(d) => (
                    <div>
                      <p className="font-bold">{hourLabel(Number(d.x))}</p>
                      <p>
                        <b>{d.values.ok + d.values.late}</b> orders · <b>{d.values.late}</b> late
                      </p>
                      {d.note && <p className="opacity-75">{d.note}</p>}
                    </div>
                  )}
                />
              )}
            </section>

            <section className="rounded-3xl bg-card p-5 shadow-soft">
              <h2 className="mb-1 font-display text-lg font-bold">Lates by cause</h2>
              <p className="mb-4 text-xs text-ink-soft">Split clock: whichever overran more. Kitchen lates are charged to the restaurant.</p>
              {lateTotal === 0 ? (
                <p className="text-sm text-ink-soft">No late orders in this range. 🎯</p>
              ) : (
                <HBars
                  rows={[
                    { label: "Kitchen", value: causes.kitchen ?? 0, color: "var(--wp-chartA)", display: `${causes.kitchen ?? 0}` },
                    { label: "Delivery", value: causes.delivery ?? 0, color: "var(--wp-chartB)", display: `${causes.delivery ?? 0}` },
                    ...(causes.pending ? [{ label: "Still on the way", value: causes.pending, color: "var(--wp-inkSoft)", display: `${causes.pending}` }] : []),
                  ]}
                />
              )}
            </section>
          </div>

          <section className="overflow-hidden rounded-3xl bg-card shadow-soft">
            <h2 className="px-5 pt-5 pb-3 font-display text-lg font-bold">By restaurant</h2>
            <div className="overflow-x-auto">
              <table className="tabular w-full min-w-[720px] text-sm">
                <thead className="border-y border-line text-left text-xs tracking-wider text-ink-soft uppercase">
                  <tr>
                    <th className="px-5 py-2 font-semibold">Restaurant</th>
                    <th className="px-2 py-2 font-semibold">Orders</th>
                    <th className="px-2 py-2 font-semibold">On time</th>
                    <th className="px-2 py-2 font-semibold">Late</th>
                    <th className="px-2 py-2 font-semibold">Kitchen-caused</th>
                    <th className="px-2 py-2 font-semibold">Avg min</th>
                    <th className="px-2 py-2 font-semibold">Free cost</th>
                    <th className="px-5 py-2 font-semibold">Charged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {r.by_restaurant.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-6 text-center text-ink-soft">
                        No orders in this range.
                      </td>
                    </tr>
                  )}
                  {r.by_restaurant.map((row) => {
                    const maxOrders = Math.max(...r.by_restaurant.map((x) => x.orders));
                    const done = row.on_time + row.late;
                    return (
                      <tr key={row.id}>
                        <td className="px-5 py-2.5 font-semibold">{row.name}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-8">{row.orders}</span>
                            <span className="h-2 w-20 rounded-r bg-muted">
                              <span className="block h-full rounded-r-[4px] bg-chart-b" style={{ width: `${(row.orders / maxOrders) * 100}%` }} />
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5">{done ? `${Math.round((row.on_time / done) * 100)}%` : "—"}</td>
                        <td className="px-2 py-2.5">{row.late}</td>
                        <td className={cn("px-2 py-2.5", row.kitchen_lates > 0 && "font-bold text-chili-deep")}>{row.kitchen_lates}</td>
                        <td className="px-2 py-2.5">{row.avg_min ?? "—"}</td>
                        <td className="px-2 py-2.5">{formatPKR(row.free_cost_pkr)}</td>
                        <td className="px-5 py-2.5">{formatPKR(row.charged_pkr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-soft">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-extrabold", tone === "good" && "text-mint-deep", tone === "bad" && "text-chili-deep")}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}
