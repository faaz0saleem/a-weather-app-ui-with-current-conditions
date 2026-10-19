"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bike, CloudRain, Loader2, ShieldAlert, Timer, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { WaqtMap, type MapMarker } from "@/components/map";
import { ClockDigits } from "@/components/race/countdown-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/client/api";
import { useTableChanges } from "@/lib/client/realtime";
import { useServerNow } from "@/lib/client/server-clock";
import { formatPKR, formatTime } from "@/lib/format";
import type { LiveBoard, LiveOrder } from "@/lib/server/admin";
import { timerTone, TONE_BG } from "@/lib/timer";
import { cn } from "@/lib/utils";
import { AdminHeader } from "./admin-shell";

const STATUS_LABEL: Record<string, string> = {
  placed: "Waiting accept",
  accepted: "Cooking",
  ready: "Ready",
  picked_up: "On the way",
  arrived: "At gate",
};

export function LiveBoardView({ initial }: { initial: LiveBoard }) {
  const [board, setBoard] = useState(initial);
  const [cancelling, setCancelling] = useState<LiveOrder | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const now = useServerNow(new Date(initial.now).getTime());

  const refresh = useCallback(async () => {
    try {
      setBoard(await api<LiveBoard>("/api/admin/live"));
    } catch {
      /* keep last good */
    }
  }, []);
  useTableChanges("orders", null, () => void refresh());
  useTableChanges("riders", null, () => void refresh());
  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function setRain(on: boolean) {
    try {
      await api("/api/admin/settings", { method: "PATCH", json: { rain_mode: on } });
      toast.success(on ? "Rain Mode ON — guarantee paused app-wide" : "Rain Mode OFF — guarantee back on");
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function assign(orderId: string, riderId: string | null) {
    try {
      await api(`/api/admin/orders/${orderId}/assign`, { json: { riderId } });
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const atRisk = board.orders.filter((o) => o.lateRisk).length;
  const unassigned = board.orders.filter((o) => !o.rider && ["accepted", "ready"].includes(o.status)).length;
  const online = board.riders.filter((r) => r.status !== "offline" && r.isActive);
  const freeRiders = board.riders.filter((r) => r.status === "idle" && r.isActive);

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [];
    board.riders
      .filter((r) => r.lat != null && r.lng != null && r.status !== "offline")
      .forEach((r) => m.push({ id: `r-${r.id}`, kind: "rider", position: { lat: r.lat!, lng: r.lng! }, label: "🛵", title: r.name, tone: r.status === "idle" ? "default" : "muted" }));
    board.orders.forEach((o) => {
      m.push({ id: `d-${o.id}`, kind: "drop", position: o.drop, label: o.lateRisk ? "⚠️" : "🏠", title: `${o.code} · ${o.drop.address}`, tone: o.lateRisk ? "warn" : "default" });
      if (!["picked_up", "arrived"].includes(o.status)) m.push({ id: `k-${o.id}`, kind: "restaurant", position: o.restaurant, label: o.restaurant.emoji, title: o.restaurant.name });
    });
    return m;
  }, [board]);

  const focus = board.orders.find((o) => o.id === selected);

  return (
    <div>
      <AdminHeader
        title="Live"
        subtitle={`${board.orders.length} active · ${formatTime(now)}${board.warp !== 1 ? ` · ⏩ time warp ${board.warp}×` : ""}`}
        right={
          <label
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-2.5 font-semibold shadow-soft",
              board.rainMode ? "bg-ink text-cream" : "bg-card",
            )}
          >
            <CloudRain className={cn("size-5", board.rainMode && "text-brand")} />
            Rain Mode
            <Switch checked={board.rainMode} onCheckedChange={setRain} aria-label="Rain Mode" />
          </label>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile label="Active orders" value={board.orders.length} icon={<Timer className="size-4" />} />
        <Tile label="Predicted late" value={atRisk} tone={atRisk ? "bad" : undefined} icon={<AlertTriangle className="size-4" />} />
        <Tile label="Waiting for rider" value={unassigned} tone={unassigned ? "warn" : undefined} icon={<UserX className="size-4" />} />
        <Tile label="Riders online" value={`${online.length}`} sub={`${freeRiders.length} free`} icon={<Bike className="size-4" />} />
        <Link href="/admin/reviews" className="contents">
          <Tile label="GPS reviews" value={board.flaggedCount} tone={board.flaggedCount ? "warn" : undefined} icon={<ShieldAlert className="size-4" />} />
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <section aria-label="Active orders" className="min-w-0">
          {board.orders.length === 0 ? (
            <div className="rounded-3xl bg-card p-10 text-center text-ink-soft shadow-soft">No active orders. Quiet shift ☕</div>
          ) : (
            <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
              <table className="w-full text-sm">
                <thead className="border-b border-line text-left text-xs tracking-wider text-ink-soft uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-2 py-3 font-semibold">Clock</th>
                    <th className="hidden px-2 py-3 font-semibold lg:table-cell">Predicted</th>
                    <th className="px-2 py-3 font-semibold">Rider</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {board.orders.map((o) => {
                    const remaining = o.promisedBy ? (new Date(o.promisedBy).getTime() - now) / 1000 : null;
                    const tone = timerTone(remaining, o.guaranteeActive ? o.guaranteeState : "off");
                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelected(o.id)}
                        className={cn("cursor-pointer align-middle hover:bg-muted/60", o.lateRisk && "bg-chili/5", selected === o.id && "bg-brand-soft/40")}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-lg">{o.restaurant.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-bold">
                                {o.code} {o.isSimulated && <Badge variant="muted">sim</Badge>}
                              </p>
                              <p className="truncate text-xs text-ink-soft">
                                {o.restaurant.name} · {STATUS_LABEL[o.status] ?? o.status} · {formatPKR(o.totalPkr)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          {!o.guaranteeActive ? (
                            <Badge variant="muted">
                              <CloudRain /> no timer
                            </Badge>
                          ) : o.guaranteeState === "free" ? (
                            <Badge variant="gold">FREE</Badge>
                          ) : o.status === "arrived" ? (
                            <Badge variant="mint">arrived</Badge>
                          ) : (
                            <span className={cn("inline-flex rounded-lg px-2 py-0.5 font-bold text-ink", TONE_BG[tone])}>
                              <ClockDigits seconds={remaining ?? 0} className="text-base" />
                            </span>
                          )}
                        </td>
                        <td className="hidden px-2 py-3 lg:table-cell">
                          {o.predictedArrival ? (
                            <span className={cn("tabular text-xs font-semibold", o.lateRisk ? "text-chili-deep" : "text-ink-soft")}>
                              {o.lateRisk && "⚠ "}
                              {formatTime(o.predictedArrival)}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-soft">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          {["accepted", "ready", "picked_up"].includes(o.status) ? (
                            <select
                              aria-label={`Rider for ${o.code}`}
                              value={o.rider?.id ?? ""}
                              onChange={(e) => assign(o.id, e.target.value || null)}
                              className={cn("h-9 max-w-36 rounded-xl border px-2 text-xs font-semibold", o.rider ? "border-line bg-card" : "border-amber bg-amber/10")}
                            >
                              <option value="">Unassigned</option>
                              {board.riders
                                .filter((r) => r.isActive && (r.status === "idle" || r.id === o.rider?.id || r.status === "offline"))
                                .map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name} {r.status === "offline" ? "(offline)" : ""}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span className="text-xs text-ink-soft">{o.rider?.name ?? "—"}</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon-sm" variant="ghost" aria-label={`Cancel ${o.code}`} onClick={() => setCancelling(o)}>
                            <X className="size-4 text-chili-deep" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-label="Fleet map" className="xl:sticky xl:top-5 xl:self-start">
          <WaqtMap
            className="h-[420px] rounded-3xl shadow-soft"
            center={focus ? focus.drop : { lat: 31.4697, lng: 74.4115 }}
            zoom={13}
            markers={markers}
            fitTo={focus ? [focus.drop, focus.restaurant] : undefined}
            fitKey={focus?.id ?? "all"}
          />
          <p className="mt-2 text-xs text-ink-soft">🛵 riders (faded = on a job) · 🏠 drops (⚠️ = predicted late) · kitchens with active orders</p>
        </section>
      </div>

      <CancelDialog order={cancelling} onClose={() => setCancelling(null)} onDone={refresh} />
    </div>
  );
}

function Tile({ label, value, sub, icon, tone }: { label: string; value: number | string; sub?: string; icon: React.ReactNode; tone?: "bad" | "warn" }) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-soft">
      <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-ink-soft uppercase">
        {icon} {label}
      </p>
      <p className={cn("mt-1 font-display text-3xl font-extrabold", tone === "bad" && "text-chili-deep", tone === "warn" && "text-amber-deep")}>
        {value}
      </p>
      {sub && <p className="text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

function CancelDialog({ order, onClose, onDone }: { order: LiveOrder | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!order) return;
    setBusy(true);
    try {
      await api(`/api/admin/orders/${order.id}/cancel`, { json: { reason } });
      toast.success(`${order.code} cancelled`);
      onClose();
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Cancel {order?.code}?</DialogTitle>
        <DialogDescription>The customer is told immediately. If the order was already free, it stays free.</DialogDescription>
        <Input autoFocus placeholder="Reason (shown in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button variant="destructive" onClick={submit} disabled={busy || reason.trim().length < 2}>
          {busy && <Loader2 className="animate-spin" />} Cancel order
        </Button>
      </DialogContent>
    </Dialog>
  );
}
