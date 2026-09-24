"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Banknote, CloudRain, Loader2, MapPin, Minus, Plus, ShieldCheck, TriangleAlert, Zap } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { EmptyState } from "@/components/customer/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatAddress } from "@/lib/address";
import { api, ClientApiError } from "@/lib/client/api";
import { cartStore, useCart } from "@/lib/client/cart";
import { formatPKR } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { AddressRow } from "@/lib/server/catalog";
import type { CheckoutQuote } from "@/lib/server/orders";
import { cn, haptic } from "@/lib/utils";
import { setChosenAddress } from "./address-switcher";
import { PageHeader } from "./page-header";

export function CheckoutView({
  signedIn,
  addresses,
  initialAddressId,
}: {
  signedIn: boolean;
  addresses: AddressRow[];
  initialAddressId: string | null;
}) {
  const cart = useCart();
  const router = useRouter();
  const [addressId, setAddressId] = useState(initialAddressId);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quotedKey, setQuotedKey] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [note, setNote] = useState(cart?.note ?? "");
  const address = addresses.find((a) => a.id === addressId) ?? null;

  const lines = cart?.lines.map((l) => ({ itemId: l.itemId, qty: l.qty, options: l.options })) ?? [];
  const linesKey = JSON.stringify(lines);
  const restaurantId = cart?.restaurantId ?? null;
  const quoteKey = JSON.stringify([restaurantId, addressId, linesKey]);
  const loading = quotedKey !== quoteKey;

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    const key = JSON.stringify([restaurantId, addressId, linesKey]);
    api<CheckoutQuote>("/api/quote", { json: { restaurantId, addressId, lines: JSON.parse(linesKey) } })
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => {
        if (!cancelled) setQuotedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, addressId, linesKey, tick]);

  useEffect(() => {
    const id = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (!cart) {
    return (
      <>
        <PageHeader title={t.cart.title} />
        <div className="px-5 pt-6">
          <EmptyState
            emoji="🛒"
            title={t.cart.empty}
            body={t.cart.emptyBody}
            action={
              <Button asChild>
                <Link href="/">{t.cart.browse}</Link>
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const pricing = quote?.pricing;
  const q = quote?.quote;
  const canPlace = signedIn && !!address && !!pricing && !!q?.ok && !placing && !loading;

  async function place() {
    if (!cart || !q?.ok || !address) return;
    setPlacing(true);
    haptic([10, 40, 10]);
    try {
      const res = await api<{ id: string; code: string }>("/api/orders", {
        json: { restaurantId: cart.restaurantId, addressId: address.id, lines, note, expectGuarantee: q.guarantee === "active" },
      });
      cartStore.clear();
      router.replace(`/orders/${res.id}?placed=1`);
    } catch (e) {
      const err = e as ClientApiError;
      toast.error(err.message);
      refresh();
      setPlacing(false);
    }
  }

  return (
    <div className="pb-40">
      <PageHeader title={t.checkout.title} back={`/r/${cart.restaurantSlug}`} />

      <div className="space-y-4 px-5">
        {/* Address */}
        <section className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wider text-ink-soft uppercase">{t.checkout.deliverTo}</h2>
            {signedIn && (
              <Link href="/addresses/new?next=/checkout" className="text-sm font-bold text-brand">
                + {t.profile.addAddress}
              </Link>
            )}
          </div>
          {!signedIn ? (
            <Button asChild variant="ink" className="w-full">
              <Link href="/login?next=/checkout">{t.auth.loginToOrder}</Link>
            </Button>
          ) : addresses.length === 0 ? (
            <Button asChild variant="soft" className="w-full">
              <Link href="/addresses/new?next=/checkout">
                <MapPin /> {t.checkout.addAddress}
              </Link>
            </Button>
          ) : (
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAddressId(a.id);
                    setChosenAddress(a.id);
                  }}
                  className={cn(
                    "w-60 shrink-0 rounded-2xl border p-3 text-left transition-colors",
                    a.id === addressId ? "border-brand bg-brand-soft/50" : "border-line bg-cream",
                  )}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <MapPin className="size-4 text-brand" /> {a.label}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-ink-soft">{formatAddress(a)}</span>
                  {a.gate_note && <span className="mt-1 block truncate text-xs text-ink-soft">🚪 {a.gate_note}</span>}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Guarantee status — shown BEFORE placing (rules 5 & 9) */}
        <GuaranteeStatus quote={quote} loading={loading && !quote} />

        {/* Items */}
        <section className="rounded-3xl bg-card p-4 shadow-soft">
          <h2 className="mb-3 font-display text-lg font-bold">{cart.restaurantName}</h2>
          <ul className="divide-y divide-line">
            {cart.lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-xl">{l.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.name}</p>
                  {l.optionLabels.length > 0 && <p className="truncate text-xs text-ink-soft">{l.optionLabels.join(" · ")}</p>}
                  <p className="tabular text-sm font-bold">{formatPKR(l.unitPricePkr * l.qty)}</p>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
                  <button aria-label={t.cart.remove} onClick={() => cartStore.setQty(l.key, l.qty - 1)} className="grid size-8 place-items-center rounded-lg hover:bg-card">
                    <Minus className="size-4" />
                  </button>
                  <span className="tabular w-5 text-center font-bold">{l.qty}</span>
                  <button aria-label="More" onClick={() => cartStore.setQty(l.key, Math.min(20, l.qty + 1))} className="grid size-8 place-items-center rounded-lg hover:bg-card">
                    <Plus className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Textarea
            className="mt-4 min-h-14"
            placeholder={t.checkout.notePlaceholder}
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => cartStore.setNote(note)}
          />
        </section>

        {/* Bill — no hidden fees */}
        <section className="rounded-3xl bg-card p-4 shadow-soft">
          {quote?.pricingError && (
            <p className="mb-3 flex items-center gap-2 rounded-2xl bg-chili/10 px-3 py-2 text-sm font-semibold text-chili">
              <TriangleAlert className="size-4" /> {quote.pricingError}
            </p>
          )}
          {pricing ? (
            <dl className="tabular space-y-2 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">{t.checkout.subtotal}</dt>
                <dd className="font-semibold">{formatPKR(pricing.subtotalPkr)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">{t.checkout.deliveryFee}</dt>
                <dd className="font-semibold">{formatPKR(pricing.deliveryFeePkr)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-display text-xl font-bold">
                <dt>{t.checkout.total}</dt>
                <dd>{formatPKR(pricing.totalPkr)}</dd>
              </div>
              <p className="flex items-center gap-1.5 pt-1 text-xs text-ink-soft">
                <ShieldCheck className="size-4 text-mint" /> {t.checkout.noHiddenFees}
              </p>
            </dl>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
              <Skeleton className="h-7" />
            </div>
          )}
        </section>

        {/* Payment */}
        <section className="rounded-3xl bg-card p-4 shadow-soft">
          <h2 className="mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">{t.checkout.payment}</h2>
          <div className="flex items-center gap-3 rounded-2xl border border-brand bg-brand-soft/40 p-3">
            <Banknote className="size-6 text-brand" />
            <div>
              <p className="font-bold">{t.checkout.cod}</p>
              <p className="text-sm text-ink-soft">{t.checkout.codBody}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-soft">{t.checkout.moreMethodsSoon}</p>
        </section>
      </div>

      {/* Place order */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md bg-gradient-to-t from-cream via-cream to-cream/0 px-4 pt-6">
        {q?.ok && <p className="mb-2 text-center text-xs font-semibold text-ink-soft">{t.checkout.clockStarts}</p>}
        <Button size="xl" className="w-full" disabled={!canPlace} onClick={place}>
          {placing ? (
            <>
              <Loader2 className="animate-spin" /> {t.checkout.placing}
            </>
          ) : q?.ok && q.guarantee === "off" ? (
            t.checkout.rainAck
          ) : (
            t.checkout.place(pricing?.totalPkr ?? 0)
          )}
        </Button>
      </div>
    </div>
  );
}

function GuaranteeStatus({ quote, loading }: { quote: CheckoutQuote | null; loading: boolean }) {
  if (loading || !quote) return <Skeleton className="h-24 rounded-3xl" />;
  const q = quote.quote;
  if (!q.ok) {
    if (q.code === "no_address") return null;
    return (
      <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-chili/10 p-4" role="alert">
        <p className="flex items-center gap-2 font-display text-lg font-bold text-chili">
          <TriangleAlert className="size-5" /> {t.checkout.cantPlace}
        </p>
        <p className="mt-1 font-semibold text-ink">{q.message}</p>
        {q.retryInMin && <p className="mt-1 text-sm text-ink-soft">{t.eligibility.retryIn(q.retryInMin)}</p>}
      </motion.section>
    );
  }
  if (q.guarantee === "off") {
    return (
      <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-ink p-4 text-cream">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <CloudRain className="size-5 text-brand" /> {t.checkout.guaranteeOff}
        </p>
        <p className="mt-1 text-sm text-cream/80">{t.checkout.guaranteeOffBody(q.etaMin)}</p>
      </motion.section>
    );
  }
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-ink p-4 text-cream"
    >
      <div aria-hidden className="absolute -top-10 -right-10 size-36 rounded-full bg-brand/30 blur-2xl" />
      <p className="relative flex items-center gap-2 font-display text-lg font-bold">
        <Zap className="size-5 fill-brand text-brand" /> {t.checkout.guaranteeOn}
      </p>
      <p className="relative mt-1 text-sm text-cream/80">{t.checkout.guaranteeOnBody(q.etaMin, quote.freeCapPkr)}</p>
    </motion.section>
  );
}
