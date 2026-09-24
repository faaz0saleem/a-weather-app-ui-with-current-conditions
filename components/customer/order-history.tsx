"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { FoodArt } from "@/components/brand/food-art";
import { TruckArtPattern } from "@/components/brand/truck-art";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { cartStore, type Cart } from "@/lib/client/cart";
import { formatDateTime, formatDuration, formatPKR } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { OrderHistoryRow } from "@/lib/server/customer-orders";
import { haptic } from "@/lib/utils";

const LIVE = ["placed", "accepted", "ready", "picked_up", "arrived"];

function statusBadge(o: OrderHistoryRow) {
  if (LIVE.includes(o.status)) return <Badge variant="default">{t.orders.active}</Badge>;
  if (o.guaranteeState === "free") return <Badge variant="gold">🎉 {t.common.free}</Badge>;
  if (o.status === "delivered" && o.guaranteeState === "on_time") return <Badge variant="mint">{t.race.onTime}</Badge>;
  if (o.status === "rejected") return <Badge variant="muted">{t.race.rejected.split(" ").slice(0, 3).join(" ")}</Badge>;
  if (o.status === "cancelled") return <Badge variant="muted">{t.race.cancelled}</Badge>;
  return <Badge variant="outline">{o.status}</Badge>;
}

export function OrderHistory({ orders, savedPkr, freeCount }: { orders: OrderHistoryRow[]; savedPkr: number; freeCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function reorder(o: OrderHistoryRow) {
    setBusy(o.id);
    try {
      const r = await api<{ cart: NonNullable<Cart>; skipped: number }>(`/api/orders/${o.id}/reorder`, { json: {} });
      if (!r.cart.lines.length) {
        toast.error(t.errors.WP.item_unavailable);
        return;
      }
      cartStore.replace({ ...r.cart, lines: r.cart.lines.map((l) => ({ ...l, key: `${l.itemId}:${JSON.stringify(Object.entries(l.options).sort())}` })) });
      haptic(15);
      router.push("/checkout");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {freeCount > 0 && (
        <div className="relative overflow-hidden light-scope rounded-3xl bg-gold p-5 text-ink">
          <TruckArtPattern opacity={0.14} />
          <p className="relative text-xs font-bold tracking-wider uppercase opacity-75">{t.orders.savedTotal}</p>
          <p className="tabular relative font-display text-4xl font-extrabold">{formatPKR(savedPkr)}</p>
          <p className="relative text-sm font-semibold">{t.orders.savedBody(freeCount)}</p>
        </div>
      )}
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="rounded-3xl bg-card p-3 shadow-soft">
            <Link href={`/orders/${o.id}`} className="flex gap-3">
              <FoodArt emoji={o.restaurant.emoji} from={o.restaurant.from} to={o.restaurant.to} size="sm" className="size-16 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold">{o.restaurant.name}</p>
                  {statusBadge(o)}
                </div>
                <p className="truncate text-sm text-ink-soft">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                <p className="tabular mt-0.5 text-xs text-ink-soft">
                  {formatDateTime(o.placedAt)} · {formatPKR(o.totalPkr)}
                  {o.arrivedInSec != null && ` · ${formatDuration(o.arrivedInSec)}`}
                </p>
              </div>
            </Link>
            <div className="mt-3 flex gap-2">
              {LIVE.includes(o.status) ? (
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/orders/${o.id}`}>{t.orders.track}</Link>
                </Button>
              ) : (
                <Button size="sm" variant="soft" className="flex-1" onClick={() => reorder(o)} disabled={busy === o.id}>
                  {busy === o.id ? <Loader2 className="animate-spin" /> : <RotateCcw />} {t.orders.reorder}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
