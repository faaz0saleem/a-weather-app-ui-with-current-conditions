"use client";

import { useRef, useState } from "react";
import { Bike, Camera, Check, Loader2, MessageSquareText, X } from "lucide-react";
import { toast } from "sonner";
import { ClockDigits } from "@/components/race/countdown-ring";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client/api";
import { compressImage } from "@/lib/client/image";
import { formatPKR, formatTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { KitchenOrder } from "@/lib/server/kitchen";
import { cn, haptic } from "@/lib/utils";

function Items({ order, big = false }: { order: KitchenOrder; big?: boolean }) {
  return (
    <ul className={cn("space-y-1.5", big && "text-lg")}>
      {order.items.map((i, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="tabular min-w-8 font-display font-extrabold text-brand">{i.qty}×</span>
          <span className="min-w-0">
            <span className="font-bold">{i.name}</span>
            {i.options.length > 0 && <span className="block text-sm text-ink-soft">{i.options.join(" · ")}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Note({ note }: { note: string | null }) {
  if (!note) return null;
  return (
    <p className="mt-3 flex gap-2 rounded-2xl bg-amber/15 px-3 py-2 text-sm font-semibold">
      <MessageSquareText className="size-4 shrink-0" /> {note}
    </p>
  );
}

/** New order: loud, big, 2-minute accept countdown, commit prep, accept/reject. */
export function NewOrderCard({ order, now, query, onDone }: { order: KitchenOrder; now: number; query: string; onDone: () => void }) {
  const left = Math.max(0, (new Date(order.acceptBy).getTime() - now) / 1000);
  const total = (new Date(order.acceptBy).getTime() - new Date(order.placedAt).getTime()) / 1000;
  const suggested = Math.min(order.predictedPrepMin, order.maxCommitMin);
  const choices = [...new Set([suggested, suggested + 2, suggested + 4].map((m) => Math.min(m, order.maxCommitMin)))];
  const [prep, setPrep] = useState(suggested);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      await api(`/api/restaurant/orders/${order.id}/accept${query}`, { json: { prepMin: prep } });
      haptic(30);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <article className="relative overflow-hidden rounded-3xl border-2 border-brand bg-card p-4 shadow-lift">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-muted">
        <div className="h-full bg-brand transition-[width] duration-300 ease-linear" style={{ width: `${(left / total) * 100}%` }} />
      </div>
      <header className="mb-3 flex items-start justify-between gap-2 pt-1">
        <div>
          <p className="text-xs font-bold tracking-wider text-brand uppercase">{t.kitchen.newOrder}</p>
          <p className="font-display text-2xl font-extrabold">{order.code}</p>
          <p className="text-sm text-ink-soft">
            {order.customerFirstName} · {formatTime(order.placedAt)} · {formatPKR(order.totalPkr)}
          </p>
        </div>
        <div className={cn("rounded-2xl px-3 py-1.5 text-center", left < 30 ? "bg-chili text-white" : "bg-ink text-cream")}>
          <p className="text-[10px] font-bold tracking-wider uppercase opacity-80">{t.kitchen.acceptWithin}</p>
          <ClockDigits seconds={left} className="text-2xl" />
        </div>
      </header>
      <Items order={order} big />
      <Note note={order.note} />

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-semibold">
          {t.kitchen.commitPrep} <span className="text-ink-soft">· {t.kitchen.commitPrepHint}</span>
        </p>
        <div className="flex gap-2">
          {choices.map((m) => (
            <button
              key={m}
              onClick={() => setPrep(m)}
              aria-pressed={prep === m}
              className={cn(
                "tabular h-12 flex-1 rounded-2xl font-display text-lg font-bold transition-colors",
                prep === m ? "bg-ink text-cream" : "bg-muted",
              )}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" className="text-chili hover:bg-chili/10" onClick={() => setRejectOpen(true)} disabled={busy}>
          <X /> {t.kitchen.reject}
        </Button>
        <Button size="lg" variant="success" className="flex-1" onClick={accept} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Check />} {t.kitchen.accept} · {prep} min
        </Button>
      </div>
      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen} order={order} query={query} onDone={onDone} />
    </article>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  order,
  query,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  order: KitchenOrder;
  query: string;
  onDone: () => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const final = reason === "Other" ? other.trim() : reason;

  async function reject() {
    if (!final) return;
    setBusy(true);
    try {
      await api(`/api/restaurant/orders/${order.id}/reject${query}`, { json: { reason: final } });
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t.kitchen.rejectTitle}</DialogTitle>
        <DialogDescription>
          {order.code} · {t.race.notCharged}
        </DialogDescription>
        <div className="grid gap-2">
          {t.kitchen.rejectReasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              className={cn("h-12 rounded-2xl border px-4 text-left font-semibold", reason === r ? "border-chili bg-chili/10" : "border-line")}
            >
              {r}
            </button>
          ))}
          {reason === "Other" && <Input autoFocus placeholder={t.kitchen.rejectOther} value={other} onChange={(e) => setOther(e.target.value)} />}
        </div>
        <Button variant="destructive" onClick={reject} disabled={!final || busy}>
          {busy && <Loader2 className="animate-spin" />} {t.kitchen.reject}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/** Cooking: prep countdown against the committed time; mark ready with a sealed-bag photo. */
export function CookingCard({ order, now, query, onDone }: { order: KitchenOrder; now: number; query: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const readyBy = order.readyBy ? new Date(order.readyBy).getTime() : now;
  const total = (order.committedPrepMin ?? 10) * 60;
  const left = (readyBy - now) / 1000;
  const over = left < 0;
  return (
    <article className={cn("rounded-3xl bg-card p-4 shadow-soft", over && "ring-2 ring-chili")}>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-xl font-extrabold">{order.code}</p>
          <p className="text-sm text-ink-soft">{order.customerFirstName}</p>
        </div>
        <div className={cn("rounded-2xl px-3 py-1.5 text-center", over ? "bg-chili text-white" : "bg-amber/20")}>
          <p className="text-[10px] font-bold tracking-wider uppercase opacity-80">{over ? t.kitchen.overBy : t.kitchen.readyIn}</p>
          <ClockDigits seconds={Math.abs(left)} className="text-2xl" />
        </div>
      </header>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full transition-[width] duration-300", over ? "bg-chili" : "bg-amber")} style={{ width: `${Math.min(100, (1 - Math.max(0, left) / total) * 100)}%` }} />
      </div>
      <Items order={order} />
      <Note note={order.note} />
      <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
        <Bike className="size-4" /> {order.rider ? t.kitchen.riderComing(order.rider.name) : t.race.riderPending}
      </p>
      <Button size="lg" className="mt-3 w-full" onClick={() => setOpen(true)}>
        <Camera /> {t.kitchen.markReady}
      </Button>
      <ReadyDialog open={open} onOpenChange={setOpen} order={order} query={query} onDone={onDone} />
    </article>
  );
}

function ReadyDialog({
  open,
  onOpenChange,
  order,
  query,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  order: KitchenOrder;
  query: string;
  onDone: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    const b = await compressImage(file);
    setBlob(b);
    setPreview(URL.createObjectURL(b));
  }

  async function submit(noPhoto = false) {
    setBusy(true);
    const form = new FormData();
    if (noPhoto) form.set("noPhoto", "1");
    else if (blob) form.set("photo", new File([blob], "bag.jpg", { type: "image/jpeg" }));
    try {
      await api(`/api/restaurant/orders/${order.id}/ready${query}`, { method: "POST", body: form });
      haptic(30);
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t.kitchen.bagPhotoTitle}</DialogTitle>
        <DialogDescription>{t.kitchen.bagPhotoBody}</DialogDescription>
        <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-56 w-full rounded-2xl object-cover" />
        ) : (
          <button onClick={() => input.current?.click()} className="grid h-56 w-full place-items-center rounded-2xl border-2 border-dashed border-line bg-muted text-ink-soft">
            <span className="flex flex-col items-center gap-2 font-semibold">
              <Camera className="size-10" /> {t.kitchen.takePhoto}
            </span>
          </button>
        )}
        <div className="flex gap-2">
          {preview && (
            <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}>
              {t.kitchen.retake}
            </Button>
          )}
          <Button className="flex-1" size="lg" onClick={() => (blob ? submit(false) : input.current?.click())} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Check />} {blob ? t.kitchen.uploadAndReady : t.kitchen.takePhoto}
          </Button>
        </div>
        <button onClick={() => submit(true)} disabled={busy} className="text-sm font-semibold text-ink-soft underline underline-offset-4">
          {t.kitchen.noCamera}
        </button>
      </DialogContent>
    </Dialog>
  );
}

export function ReadyCard({ order }: { order: KitchenOrder }) {
  const picked = order.status === "picked_up";
  return (
    <article className={cn("flex gap-3 rounded-3xl bg-card p-4 shadow-soft", picked && "opacity-60")}>
      {order.sealedBagPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={order.sealedBagPhotoUrl} alt="" className="size-16 rounded-2xl object-cover" />
      ) : (
        <span className="grid size-16 place-items-center rounded-2xl bg-mint/15 text-2xl">🛍️</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-extrabold">{order.code}</p>
        <p className="text-sm text-ink-soft">{order.items.reduce((n, i) => n + i.qty, 0)} items</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
          <Bike className="size-4 text-mint" />
          {picked ? t.kitchen.riderHere : order.rider ? t.kitchen.riderComing(order.rider.name) : t.race.riderPending}
        </p>
      </div>
    </article>
  );
}
