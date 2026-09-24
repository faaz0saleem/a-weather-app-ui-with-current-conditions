"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Bike, Check, ChefHat, CloudRain, Home as HomeIcon, Loader2, Phone, ReceiptText, Store, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { EmptyState } from "@/components/customer/empty-state";
import { PageHeader } from "@/components/customer/page-header";
import { WaqtMap, type MapMarker } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { brand } from "@/config/brand";
import { api } from "@/lib/client/api";
import { useRiderPosition, useTableChanges } from "@/lib/client/realtime";
import { syncServerClock, useServerNow } from "@/lib/client/server-clock";
import { formatClock, formatDuration, formatPKR, formatTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { CustomerOrderView } from "@/lib/server/customer-orders";
import { timerTone, TONE_TEXT } from "@/lib/timer";
import { cn, haptic } from "@/lib/utils";
import { Celebration } from "./celebration";
import { ClockDigits, CountdownRing } from "./countdown-ring";

const STAGES = [
  { key: "placed", label: t.race.stages.placed, icon: ReceiptText },
  { key: "cooking", label: t.race.stages.cooking, icon: ChefHat },
  { key: "road", label: t.race.stages.onTheWay, icon: Bike },
  { key: "gate", label: t.race.stages.atGate, icon: HomeIcon },
] as const;

function stageIndex(status: string) {
  switch (status) {
    case "placed":
      return 0;
    case "accepted":
    case "ready":
      return 1;
    case "picked_up":
      return 2;
    case "arrived":
    case "delivered":
      return 3;
    default:
      return -1;
  }
}

function statusLine(o: CustomerOrderView) {
  switch (o.status) {
    case "placed":
      return t.race.waitingAccept;
    case "accepted":
      return t.race.cooking;
    case "ready":
      return t.race.ready;
    case "picked_up":
      return t.race.onTheWay;
    case "arrived":
      return t.race.arrived;
    case "delivered":
      return t.race.delivered;
    default:
      return "";
  }
}

/** The race screen — the hero of the app. */
export function RaceScreen({ initial, justPlaced = false }: { initial: CustomerOrderView; justPlaced?: boolean }) {
  const [order, setOrder] = useState(initial);
  const [celebrateChoice, setCelebrateChoice] = useState<boolean | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const now = useServerNow();
  const prevStatus = useRef(order.status);

  useEffect(() => {
    if (!justPlaced) return;
    toast.success(t.race.placedToast);
    haptic([15, 50, 15]);
    window.history.replaceState(null, "", `/orders/${initial.id}`);
  }, [justPlaced, initial.id]);
  const flipRequested = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ order: CustomerOrderView }>(`/api/orders/${initial.id}`);
      setOrder(r.order);
    } catch {
      /* keep last good state; realtime/poll will retry */
    }
  }, [initial.id]);

  useTableChanges("orders", `id=eq.${initial.id}`, () => void refresh());
  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  // Haptics + toasts on key transitions.
  useEffect(() => {
    if (prevStatus.current !== order.status) {
      if (order.status === "accepted") haptic([20, 60, 20]);
      if (order.status === "picked_up") haptic(30);
      if (order.status === "arrived") haptic([40, 60, 40, 60, 80]);
      prevStatus.current = order.status;
    }
  }, [order.status]);

  const riderPos = useRiderPosition(order.rider?.id ?? null, order.rider ? { lat: order.rider.lat, lng: order.rider.lng } : null);

  const promised = order.promisedBy ? new Date(order.promisedBy).getTime() : null;
  const remainingSec = promised ? (promised - now) / 1000 : null;
  const inFlight = ["placed", "accepted", "ready", "picked_up"].includes(order.status);
  const serverFree = order.guaranteeState === "free";
  // Rule 3: the screen flips the second the deadline passes on the server-synced clock…
  const deadlinePassed =
    order.guaranteeActive && order.guaranteeState === "active" && inFlight && remainingSec !== null && remainingSec <= 0;
  const isFree = serverFree || deadlinePassed;

  // …and the server confirms (and records it) right away.
  useEffect(() => {
    if (deadlinePassed && !flipRequested.current) {
      flipRequested.current = true;
      void syncServerClock(true);
      void refresh();
    }
  }, [deadlinePassed, refresh]);

  // Celebrate once per order (until dismissed).
  const celebratedKey = `wp_celebrated_${order.id}`;
  const alreadyCelebrated = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return sessionStorage.getItem(celebratedKey) === "1";
      } catch {
        return false;
      }
    },
    () => true,
  );
  const celebrate = celebrateChoice ?? (isFree && !alreadyCelebrated);
  const closeCelebration = () => {
    try {
      sessionStorage.setItem(celebratedKey, "1");
    } catch {
      /* ignore */
    }
    setCelebrateChoice(false);
  };
  useEffect(() => {
    if (isFree) haptic([60, 40, 60, 40, 200]);
  }, [isFree]);

  const tone = timerTone(isFree ? 0 : remainingSec, isFree ? "free" : order.guaranteeActive ? order.guaranteeState : "off");
  const windowSec = order.windowMin * 60;

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [
      { id: "restaurant", kind: "restaurant", position: { lat: order.restaurant.lat, lng: order.restaurant.lng }, label: order.restaurant.emoji, title: order.restaurant.name },
      { id: "drop", kind: "drop", position: { lat: order.drop.lat, lng: order.drop.lng }, label: "🏠", title: order.drop.address },
    ];
    if (riderPos && ["accepted", "ready", "picked_up", "arrived"].includes(order.status))
      m.push({ id: "rider", kind: "rider", position: riderPos, label: "🛵", pulse: order.status === "picked_up", title: order.rider?.name });
    return m;
  }, [order.restaurant, order.drop, order.status, order.rider?.name, riderPos]);

  async function cancel() {
    setCancelling(true);
    try {
      await api(`/api/orders/${order.id}/cancel`, { json: {} });
      await refresh();
      setConfirmCancel(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCancelling(false);
    }
  }

  // ─── Terminal: rejected / cancelled ─────────────────────────────────────
  if (order.status === "rejected" || (order.status === "cancelled" && !serverFree)) {
    const body =
      order.status === "rejected"
        ? `${order.rejectReason ?? ""} ${t.race.notCharged}`
        : order.cancelReason === "restaurant_timeout"
          ? t.race.timeoutCancelled
          : order.cancelledBy === "customer"
            ? `${t.race.cancelled_by_customer} ${t.race.notCharged}`
            : t.race.notCharged;
    return (
      <div className="pb-10">
        <PageHeader title={t.race.title(order.code)} back="/" />
        <div className="px-5 pt-4">
          <EmptyState
            emoji={order.status === "rejected" ? "🙏" : "🧾"}
            title={order.status === "rejected" ? t.race.rejected : t.race.cancelled}
            body={body.trim()}
            action={
              <Button asChild>
                <Link href="/">{t.cart.browse}</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const stage = stageIndex(order.status);
  const acceptLeft = (new Date(order.acceptBy).getTime() - now) / 1000;
  const arrivedIn = order.arrivedAt ? (new Date(order.arrivedAt).getTime() - new Date(order.placedAt).getTime()) / 1000 : null;
  const rainEtaAt = new Date(new Date(order.placedAt).getTime() + order.predictedEtaMin * 60_000);

  return (
    <div className="pb-12">
      <PageHeader
        title={t.race.title(order.code)}
        back="/"
        right={
          <a href={`tel:${brand.supportPhone.replace(/\s/g, "")}`} className="rounded-full px-3 py-2 text-sm font-bold text-brand">
            {t.race.helpShort}
          </a>
        }
      />

      {/* ── The ring ─────────────────────────────────────────────── */}
      <section
        className={cn(
          "relative mx-4 overflow-hidden rounded-[32px] px-4 pt-6 pb-5 shadow-soft transition-colors duration-700",
          isFree ? "bg-gold-soft" : "bg-card",
        )}
      >
        {order.guaranteeActive ? (
          <CountdownRing
            progress={isFree ? 1 : order.arrivedAt ? Math.max(0, (promised! - new Date(order.arrivedAt).getTime()) / 1000 / windowSec) : (remainingSec ?? 0) / windowSec}
            tone={order.arrivedAt && !isFree ? "mint" : tone}
            ariaLabel={remainingSec != null ? `${Math.max(0, Math.round(remainingSec / 60))} minutes left` : ""}
          >
            {isFree ? (
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                <span className="text-4xl">🎉</span>
                <span className="font-display text-5xl font-extrabold text-ink">{t.common.free}</span>
                <span className="mt-1 text-sm font-bold text-ink-soft">{t.race.freeFlip}</span>
              </motion.div>
            ) : order.arrivedAt ? (
              <div className="flex flex-col items-center">
                <span className="grid size-14 place-items-center rounded-full bg-mint text-white">
                  <Check className="size-8" strokeWidth={3} />
                </span>
                <span className="mt-2 font-display text-2xl font-extrabold">{t.race.onTime}</span>
                {arrivedIn != null && <span className="text-sm text-ink-soft">{t.race.arrivedIn(formatDuration(arrivedIn))}</span>}
              </div>
            ) : (
              <>
                <ClockDigits seconds={remainingSec ?? 0} className={cn("text-[64px] leading-none", TONE_TEXT[tone] === "text-ink-soft" ? "" : "text-ink")} />
                <span className={cn("mt-1 text-sm font-bold tracking-wider uppercase", TONE_TEXT[tone])}>{t.race.left}</span>
                <span className="sr-only" aria-live="polite">
                  {Math.max(0, Math.ceil((remainingSec ?? 0) / 60))} min
                </span>
              </>
            )}
          </CountdownRing>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-muted">
              <CloudRain className="size-8 text-ink-soft" />
            </span>
            <p className="mt-3 font-display text-2xl font-bold">{t.race.noTimer}</p>
            <p className="text-ink-soft">{t.race.rainEta(formatTime(rainEtaAt))}</p>
          </div>
        )}

        <p className="mt-4 text-center font-display text-xl font-bold" aria-live="polite">
          {isFree && order.status !== "arrived" && order.status !== "delivered" ? t.race.freeFlipBody(order.freeAmountPkr || Math.min(order.totalPkr, order.freeCapPkr)) : statusLine(order)}
        </p>
        {order.guaranteeActive && !isFree && inFlight && (
          <p className="mt-1 flex items-center justify-center gap-1 text-center text-xs text-ink-soft">
            <Zap className="size-3.5 fill-brand text-brand" /> {t.race.guaranteeNote(order.freeCapPkr)}
          </p>
        )}

        {order.status === "placed" && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="tabular flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
              <Loader2 className="size-4 animate-spin text-brand" /> {t.race.acceptIn(formatClock(Math.max(0, acceptLeft)))}
            </span>
          </div>
        )}

        {/* Stages */}
        <ol className="mt-6 grid grid-cols-4 gap-1" aria-label="Progress">
          {STAGES.map((s, i) => {
            const done = i < stage || (i === stage && (order.status === "delivered" || order.status === "arrived"));
            const current = i === stage && !done;
            const Icon = s.icon;
            return (
              <li key={s.key} className="relative flex flex-col items-center gap-1.5 text-center">
                {i > 0 && (
                  <span aria-hidden className="absolute top-5 right-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-muted">
                    <motion.span
                      className="block h-full rounded-full bg-brand"
                      initial={false}
                      animate={{ width: i <= stage ? "100%" : "0%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </span>
                )}
                <span
                  className={cn(
                    "relative grid size-10 place-items-center rounded-full border-2 transition-colors",
                    done ? "border-brand bg-brand text-brand-ink" : current ? "border-brand bg-card text-brand" : "border-line bg-card text-ink-soft",
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {current && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand/40" />}
                  <Icon className="relative size-5" />
                </span>
                <span className={cn("text-[11px] leading-tight font-bold", i <= stage ? "text-ink" : "text-ink-soft")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Map ─────────────────────────────────────────────────── */}
      <section className="mx-4 mt-4 overflow-hidden rounded-[28px] shadow-soft">
        <WaqtMap
          className="h-60"
          center={{ lat: order.drop.lat, lng: order.drop.lng }}
          markers={markers}
          fitTo={markers.map((m) => m.position)}
          fitKey={`${order.status}:${riderPos ? "r" : ""}`}
        />
      </section>

      {/* ── Rider ───────────────────────────────────────────────── */}
      {["accepted", "ready", "picked_up", "arrived", "delivered"].includes(order.status) && (
        <section className="mx-4 mt-4 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft">
          {order.rider ? (
            <>
              {order.rider.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.rider.avatarUrl} alt="" className="size-14 rounded-2xl object-cover" />
              ) : (
                <span className="grid size-14 place-items-center rounded-2xl bg-mint/15 font-display text-xl font-extrabold text-mint">
                  {order.rider.name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{t.race.yourRider}</p>
                <p className="truncate font-display text-lg font-bold">{order.rider.name}</p>
                <p className="truncate text-sm text-ink-soft">
                  {order.rider.vehicle}
                  {order.rider.plate ? ` · ${order.rider.plate}` : ""}
                </p>
              </div>
              {order.rider.phone && (
                <Button asChild size="icon" variant="soft" aria-label={t.race.callRider}>
                  <a href={`tel:${order.rider.phone}`}>
                    <Phone />
                  </a>
                </Button>
              )}
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <Loader2 className="size-4 animate-spin" /> {t.race.riderPending}
            </p>
          )}
        </section>
      )}

      {/* ── Sealed bag ──────────────────────────────────────────── */}
      <AnimatePresence>
        {order.sealedBagPhotoUrl && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mt-4 overflow-hidden rounded-3xl bg-card shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.sealedBagPhotoUrl} alt={t.race.sealedBag} className="h-48 w-full object-cover" />
            <p className="flex items-center gap-2 px-4 py-3 text-sm font-semibold">
              <Store className="size-4 text-brand" /> {t.race.sealedBag} · {order.restaurant.name}
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Items + bill ────────────────────────────────────────── */}
      <section className="mx-4 mt-4 rounded-3xl bg-card p-4 shadow-soft">
        <h2 className="mb-2 font-display text-lg font-bold">{t.race.items}</h2>
        <ul className="space-y-1.5 text-[15px]">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="font-semibold">
                  {i.qty}× {i.name}
                </span>
                {i.options.length > 0 && <span className="block truncate text-xs text-ink-soft">{i.options.join(" · ")}</span>}
              </span>
              <span className="tabular shrink-0">{formatPKR(i.lineTotalPkr)}</span>
            </li>
          ))}
        </ul>
        <div className="tabular mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>{t.checkout.deliveryFee}</span>
            <span>{formatPKR(order.deliveryFeePkr)}</span>
          </div>
          {isFree && (
            <div className="flex justify-between font-bold text-[color-mix(in_oklab,var(--wp-gold)_65%,var(--wp-ink))]">
              <span>{t.race.freeFlip}</span>
              <span>−{formatPKR(order.freeAmountPkr || Math.min(order.totalPkr, order.freeCapPkr))}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 font-display text-xl font-bold">
            <span>{t.race.toPay}</span>
            <span className={cn(isFree && "text-[color-mix(in_oklab,var(--wp-gold)_65%,var(--wp-ink))]")}>
              {isFree
                ? formatPKR(order.guaranteeState === "free" ? order.amountToCollectPkr : Math.max(0, order.totalPkr - order.freeCapPkr))
                : formatPKR(order.totalPkr)}
            </span>
          </div>
          <p className="text-xs text-ink-soft">{t.checkout.cod}</p>
        </div>
        {isFree && (
          <Button variant="gold" className="mt-4 w-full" onClick={() => setCelebrateChoice(true)}>
            🎉 {t.race.freeShare}
          </Button>
        )}
      </section>

      {order.status === "placed" && (
        <div className="mx-4 mt-4">
          <Button variant="ghost" className="w-full text-chili" onClick={() => setConfirmCancel(true)}>
            {t.race.cancelOrder}
          </Button>
        </div>
      )}

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogTitle>{t.race.cancelOrder}</DialogTitle>
          <DialogDescription>{t.race.cancelConfirm}</DialogDescription>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmCancel(false)}>
              {t.common.back}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={cancel} disabled={cancelling}>
              {cancelling && <Loader2 className="animate-spin" />} {t.race.cancelOrder}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Celebration
        open={celebrate}
        onClose={closeCelebration}
        orderId={order.id}
        amountPkr={order.freeAmountPkr || Math.min(order.totalPkr, order.freeCapPkr)}
        restaurantName={order.restaurant.name}
        collectPkr={order.guaranteeState === "free" ? order.amountToCollectPkr : Math.max(0, order.totalPkr - order.freeCapPkr)}
      />
    </div>
  );
}
