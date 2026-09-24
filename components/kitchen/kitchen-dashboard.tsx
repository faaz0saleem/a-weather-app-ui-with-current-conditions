"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, ChefHat, Coffee, Pause, Play, Power, Timer, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { EmptyState } from "@/components/customer/empty-state";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { audioReady, chime, keepAwake, setAlarm, unlockAudio } from "@/lib/client/alarm";
import { api } from "@/lib/client/api";
import { useTableChanges } from "@/lib/client/realtime";
import { useServerNow } from "@/lib/client/server-clock";
import { formatTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { KitchenOrder } from "@/lib/server/kitchen";
import { cn, haptic } from "@/lib/utils";
import { CookingCard, NewOrderCard, ReadyCard } from "./order-cards";
import { MenuManager } from "./menu-manager";
import { TodayStats } from "./today-stats";

export type KitchenInfo = { id: string; name: string; emoji: string; pausedUntil: string | null; isAccepting: boolean };

export function KitchenDashboard({
  restaurant,
  asAdmin,
  initialOrders,
  serverNow,
}: {
  restaurant: KitchenInfo;
  asAdmin: boolean;
  initialOrders: KitchenOrder[];
  serverNow: number;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [status, setStatus] = useState({ pausedUntil: restaurant.pausedUntil, isAccepting: restaurant.isAccepting });
  const [shiftOn, setShiftOn] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [tab, setTab] = useState("live");
  const now = useServerNow(serverNow);
  const q = asAdmin ? `?restaurantId=${restaurant.id}` : "";
  const known = useRef(new Set(initialOrders.map((o) => o.id)));

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ orders: KitchenOrder[]; restaurant: { pausedUntil: string | null; isAccepting: boolean } }>(`/api/restaurant/orders${q}`);
      const fresh = r.orders.filter((o) => o.status === "placed" && !known.current.has(o.id));
      r.orders.forEach((o) => known.current.add(o.id));
      if (fresh.length) haptic([100, 50, 100]);
      setOrders(r.orders);
      setStatus({ pausedUntil: r.restaurant.pausedUntil, isAccepting: r.restaurant.isAccepting });
    } catch {
      /* offline — realtime + poll will catch up */
    }
  }, [q]);

  useTableChanges("orders", `restaurant_id=eq.${restaurant.id}`, () => void refresh());
  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const newOrders = orders.filter((o) => o.status === "placed" && new Date(o.acceptBy).getTime() > now);
  const cooking = orders.filter((o) => o.status === "accepted");
  const out = orders.filter((o) => o.status === "ready" || o.status === "picked_up");

  // The alarm rings while any order is waiting to be accepted.
  const ringing = shiftOn && newOrders.length > 0;
  useEffect(() => {
    setAlarm(ringing && audioReady());
    return () => setAlarm(false);
  }, [ringing]);

  // Keep the screen awake during the shift (re-acquire after tab switches).
  useEffect(() => {
    if (!shiftOn) return;
    void keepAwake(true);
    const onVis = () => document.visibilityState === "visible" && void keepAwake(true);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void keepAwake(false);
    };
  }, [shiftOn]);

  async function startShift() {
    const ok = await unlockAudio();
    setShiftOn(true);
    chime();
    if (!ok) toast.message("Sound is blocked — tap anywhere on the page, then Start shift again.");
  }

  async function updateStatus(body: { pauseMin?: number; isAccepting?: boolean }) {
    try {
      const r = await api<{ pausedUntil: string | null; isAccepting: boolean }>(`/api/restaurant/status${q}`, { json: body });
      setStatus(r);
      setPauseOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const paused = status.pausedUntil && new Date(status.pausedUntil).getTime() > now;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-10 sm:px-6">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-ink text-2xl">{restaurant.emoji}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-extrabold">{restaurant.name}</h1>
          <p className="text-sm text-ink-soft">
            {asAdmin ? (
              <Link href="/restaurant" className="font-semibold text-brand">
                ← all kitchens
              </Link>
            ) : (
              t.kitchen.title
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2 text-sm font-semibold shadow-soft">
          <Switch checked={status.isAccepting} onCheckedChange={(v) => updateStatus({ isAccepting: v })} aria-label={t.kitchen.closedToggle} />
          {t.kitchen.closedToggle}
        </label>
        {paused ? (
          <Button variant="soft" onClick={() => updateStatus({ pauseMin: 0 })}>
            <Play /> {t.kitchen.resume} · {formatTime(status.pausedUntil!)}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setPauseOpen(true)}>
            <Pause /> {t.kitchen.pause}
          </Button>
        )}
        {shiftOn ? (
          <Button variant="ink" onClick={() => setShiftOn(false)}>
            <span className="size-2.5 animate-pulse rounded-full bg-mint" /> {t.kitchen.shiftOn}
          </Button>
        ) : (
          <Button onClick={startShift}>
            <Power /> {t.kitchen.startShift}
          </Button>
        )}
      </header>

      {!shiftOn && (
        <button
          onClick={startShift}
          className="mb-4 flex w-full items-center gap-3 rounded-3xl border-2 border-dashed border-brand bg-brand-soft/60 p-4 text-left"
        >
          <BellRing className="size-8 shrink-0 animate-wiggle text-brand" />
          <span>
            <span className="block font-display text-lg font-bold">{t.kitchen.startShift}</span>
            <span className="text-sm text-ink-soft">{t.kitchen.startShiftBody}</span>
          </span>
        </button>
      )}

      {paused && (
        <p className="mb-4 rounded-2xl bg-amber/15 px-4 py-3 font-semibold">⏸ {t.kitchen.paused(formatTime(status.pausedUntil!))}</p>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="live">
            <Timer className="size-4" /> {t.kitchen.tabs.live}
            {newOrders.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-chili text-[11px] text-white">{newOrders.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="menu">
            <UtensilsCrossed className="size-4" /> {t.kitchen.tabs.menu}
          </TabsTrigger>
          <TabsTrigger value="today">
            <ChefHat className="size-4" /> {t.kitchen.tabs.today}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          {orders.length === 0 ? (
            <EmptyState emoji="🍳" title={t.kitchen.noOrders} body={t.kitchen.noOrdersBody} className="mx-auto mt-6 max-w-lg" />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <Column title={t.kitchen.newOrder} count={newOrders.length} tone="brand">
                <AnimatePresence initial={false}>
                  {newOrders.map((o) => (
                    <motion.div key={o.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 40 }}>
                      <NewOrderCard order={o} now={now} query={q} onDone={refresh} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Column>
              <Column title={t.kitchen.cooking} count={cooking.length} tone="amber">
                <AnimatePresence initial={false}>
                  {cooking.map((o) => (
                    <motion.div key={o.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}>
                      <CookingCard order={o} now={now} query={q} onDone={refresh} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Column>
              <Column title={t.kitchen.waitingRider} count={out.length} tone="mint">
                <AnimatePresence initial={false}>
                  {out.map((o) => (
                    <motion.div key={o.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <ReadyCard order={o} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Column>
            </div>
          )}
        </TabsContent>

        <TabsContent value="menu">{tab === "menu" && <MenuManager query={q} />}</TabsContent>
        <TabsContent value="today">{tab === "today" && <TodayStats query={q} />}</TabsContent>
      </Tabs>

      <Drawer open={pauseOpen} onOpenChange={setPauseOpen}>
        <DrawerContent>
          <div className="px-5 pb-8">
            <DrawerTitle className="mt-2">{t.kitchen.pauseTitle}</DrawerTitle>
            <DrawerDescription className="mb-4">{t.eligibility.paused(20)}</DrawerDescription>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 60].map((m) => (
                <Button key={m} variant="outline" size="lg" onClick={() => updateStatus({ pauseMin: m })}>
                  <Coffee className="size-4" /> {t.kitchen.pauseFor(m)}
                </Button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Column({ title, count, tone, children }: { title: string; count: number; tone: "brand" | "amber" | "mint"; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
        <span className={cn("size-2.5 rounded-full", { brand: "bg-brand", amber: "bg-amber", mint: "bg-mint" }[tone])} />
        {title}
        <span className="tabular rounded-full bg-muted px-2 text-sm">{count}</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
