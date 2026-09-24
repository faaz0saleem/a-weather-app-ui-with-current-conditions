"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, Bike, CheckCircle2, Loader2, MapPin, Navigation, Phone, Power, Radar, ShieldCheck, Store, TriangleAlert, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { WaqtMap, type MapMarker } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ClientApiError } from "@/lib/client/api";
import { useTableChanges } from "@/lib/client/realtime";
import { currentPosition, useRiderLocation } from "@/lib/client/rider-location";
import { formatKm, formatPKR } from "@/lib/format";
import { haversineM } from "@/lib/geo";
import { t } from "@/lib/i18n";
import type { RiderState } from "@/lib/server/rider";
import { cn, haptic } from "@/lib/utils";

const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

/**
 * Rider app. Rule 11: no countdown, no deadline, no "hurry" — anywhere.
 * The job data itself comes pre-sanitised from the server.
 */
export function RiderApp({ initial }: { initial: RiderState }) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [arrivedPrompt, setArrivedPrompt] = useState<{ distanceM: number | null } | null>(null);
  const [confirmDeliver, setConfirmDeliver] = useState(false);
  const online = state.rider.status !== "offline";
  const job = state.job;
  const { fix, status: gps } = useRiderLocation({
    riderId: state.rider.id,
    online,
    broadcastSec: state.cadence.broadcastSec,
    saveSec: state.cadence.saveSec,
  });

  const refresh = useCallback(async () => {
    try {
      setState(await api<RiderState>("/api/rider/job"));
    } catch {
      /* offline; poll retries */
    }
  }, []);

  // A new job (or any change to it) bumps riders.job_rev → realtime → refetch.
  useTableChanges("riders", `id=eq.${state.rider.id}`, () => void refresh());
  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const jobId = job?.id;
  useEffect(() => {
    if (jobId) haptic([120, 80, 120]);
  }, [jobId]);

  async function act(key: string, fn: () => Promise<RiderState>) {
    setBusy(key);
    try {
      setState(await fn());
      haptic(25);
    } catch (e) {
      if (e instanceof ClientApiError && (e.code === "outside_geofence" || e.code === "no_gps")) {
        setArrivedPrompt({ distanceM: (e.extra.distanceM as number | null) ?? null });
      } else toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function goOnline(on: boolean) {
    const pos = on ? await currentPosition(6000) : null;
    await act("online", () => api<RiderState>("/api/rider/status", { json: { online: on, lat: pos?.lat, lng: pos?.lng, accuracy: pos?.accuracy } }));
  }

  async function arrived(reason?: string) {
    if (!job) return;
    const pos = fix ?? (await currentPosition());
    await act("arrived", () =>
      api<RiderState>(`/api/rider/jobs/${job.id}/arrived`, {
        json: { lat: pos?.lat ?? null, lng: pos?.lng ?? null, accuracy: pos?.accuracy ?? null, reason: reason ?? null },
      }),
    );
  }

  const toDrop = job && fix ? haversineM(fix, job.drop) : null;
  const markers = useMemo<MapMarker[]>(() => {
    if (!job) return [];
    const m: MapMarker[] = [
      { id: "pickup", kind: "restaurant", position: job.pickup, label: "🍽️" },
      { id: "drop", kind: "drop", position: job.drop, label: "🏠" },
    ];
    if (fix) m.push({ id: "me", kind: "rider", position: fix, label: "🛵", pulse: true });
    return m;
  }, [job, fix]);

  return (
    <div className="pb-10">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-mint/15 font-display text-lg font-extrabold text-mint">
          {state.rider.name.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold">{state.rider.name}</p>
          <p className="truncate text-xs text-ink-soft">
            {state.rider.vehicle}
            {state.rider.plate ? ` · ${state.rider.plate}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold",
            online ? "bg-mint/15 text-mint" : "bg-muted text-ink-soft",
          )}
        >
          <span className={cn("size-2 rounded-full", online ? "animate-pulse bg-mint" : "bg-ink-soft")} />
          {online ? t.rider.online : t.rider.offline}
        </span>
      </header>

      {/* GPS problems */}
      {online && gps !== "ok" && gps !== "idle" && (
        <div className="mx-5 mb-3 flex gap-2 rounded-2xl bg-amber/15 px-4 py-3 text-sm font-semibold">
          <TriangleAlert className="size-5 shrink-0" />
          {gps === "locating" ? t.common.loading : gps === "denied" ? t.rider.locationDenied : gps === "insecure" ? t.rider.httpsNeeded : t.rider.locationNeeded}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!online ? (
          <motion.section key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5">
            <div className="rounded-[32px] bg-ink p-6 text-center text-cream">
              <Bike className="mx-auto size-14 text-brand" />
              <p className="mt-3 font-display text-2xl font-bold">{t.rider.offline}</p>
              <p className="mt-1 text-sm text-cream/70">{t.rider.offlineBody}</p>
              <Button size="xl" className="mt-6 w-full" onClick={() => goOnline(true)} disabled={busy === "online"}>
                {busy === "online" ? <Loader2 className="animate-spin" /> : <Power />} {t.rider.goOnline}
              </Button>
            </div>
          </motion.section>
        ) : !job ? (
          <motion.section key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5">
            <div className="relative overflow-hidden rounded-[32px] bg-card p-6 text-center shadow-soft">
              <div className="relative mx-auto grid size-28 place-items-center">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-mint/30" />
                <span className="absolute inset-4 animate-pulse-ring rounded-full bg-mint/30 [animation-delay:.5s]" />
                <Radar className="relative size-12 text-mint" />
              </div>
              <p className="mt-2 font-display text-xl font-bold">{t.rider.waiting}</p>
              <p className="text-sm text-ink-soft">{t.rider.waitingBody}</p>
              {fix && <p className="tabular mt-2 text-xs text-ink-soft">{t.rider.gpsWeak(fix.accuracy)}</p>}
            </div>
            <Button variant="ghost" className="mt-3 w-full" onClick={() => goOnline(false)} disabled={busy === "online"}>
              {t.rider.goOffline}
            </Button>
          </motion.section>
        ) : (
          <motion.section key={`job-${job.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 px-5">
            {/* Cash — huge */}
            <div className={cn("rounded-[32px] p-5 text-center", job.collectPkr > 0 ? "bg-ink text-cream" : "bg-mint text-white")}>
              <p className="text-sm font-bold tracking-wider uppercase opacity-80">{t.rider.collect}</p>
              <p className="tabular font-display text-6xl leading-tight font-extrabold">{formatPKR(job.collectPkr)}</p>
              {job.coveredByWaqtpe && <p className="text-sm font-semibold opacity-90">{t.rider.nothingToCollect}</p>}
            </div>

            <WaqtMap className="h-48 rounded-3xl" center={job.drop} markers={markers} fitTo={markers.map((m) => m.position)} fitKey={`${job.id}:${job.status}`} />

            {/* Pickup */}
            <Stop
              icon={<Store className="size-5" />}
              label={t.rider.pickup}
              title={job.pickup.name}
              subtitle={job.pickup.address}
              active={job.status === "accepted" || job.status === "ready"}
              done={["picked_up", "arrived", "delivered"].includes(job.status)}
              phone={job.pickup.phone}
              phoneLabel={t.rider.callKitchen}
              maps={mapsLink(job.pickup.lat, job.pickup.lng)}
            >
              {(job.status === "accepted" || job.status === "ready") && (
                <p className={cn("mt-2 rounded-xl px-3 py-2 text-sm font-semibold", job.status === "ready" ? "bg-mint/15 text-mint" : "bg-muted")}>
                  {job.status === "ready" ? t.rider.foodReady : t.rider.waitForFood}
                </p>
              )}
              <ul className="mt-2 text-sm text-ink-soft">
                {job.items.map((i, idx) => (
                  <li key={idx}>
                    {i.qty}× {i.name}
                  </li>
                ))}
              </ul>
            </Stop>

            {/* Drop */}
            <Stop
              icon={<MapPin className="size-5" />}
              label={t.rider.drop}
              title={job.customer.name}
              subtitle={job.drop.address}
              active={job.status === "picked_up" || job.status === "arrived"}
              done={job.status === "delivered"}
              phone={job.customer.phone}
              phoneLabel={t.rider.callCustomer}
              maps={mapsLink(job.drop.lat, job.drop.lng)}
            >
              {job.drop.gateNote && (
                <p className="mt-2 rounded-xl bg-amber/15 px-3 py-2 text-sm font-semibold">
                  🚪 {t.rider.gateNote}: {job.drop.gateNote}
                </p>
              )}
              {toDrop != null && job.status === "picked_up" && <p className="tabular mt-2 text-sm text-ink-soft">{formatKm(toDrop / 1000)}</p>}
            </Stop>

            {/* The one big action */}
            {job.status === "accepted" || job.status === "ready" ? (
              <Button
                size="xl"
                className="w-full"
                disabled={job.status !== "ready" || busy === "pickup"}
                onClick={() => act("pickup", () => api<RiderState>(`/api/rider/jobs/${job.id}/pickup`, { json: { lat: fix?.lat, lng: fix?.lng } }))}
              >
                {busy === "pickup" ? <Loader2 className="animate-spin" /> : <Bike />} {t.rider.pickedUp}
              </Button>
            ) : job.status === "picked_up" ? (
              <Button size="xl" variant="ink" className="w-full" disabled={busy === "arrived"} onClick={() => arrived()}>
                {busy === "arrived" ? <Loader2 className="animate-spin" /> : <MapPin />} {t.rider.arrived}
              </Button>
            ) : job.status === "arrived" ? (
              <Button size="xl" variant="success" className="w-full" disabled={busy === "delivered"} onClick={() => setConfirmDeliver(true)}>
                <CheckCircle2 /> {t.rider.delivered}
              </Button>
            ) : null}

            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
              <ShieldCheck className="size-4 text-mint" /> {t.rider.safety}
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Today */}
      <section className="mx-5 mt-5 rounded-3xl bg-card p-4 shadow-soft">
        <p className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <Wallet className="size-5 text-brand" /> {t.rider.todayEarnings}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat value={formatPKR(state.today.earningsPkr)} label={t.rider.todayJobs(state.today.jobs)} />
          <Stat value={formatPKR(state.today.cashCollectedPkr)} label={t.rider.cashCollected} />
          <Stat value={formatKm(state.today.km)} label={t.rider.road} />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
          <Banknote className="size-4" /> {t.rider.payNote}
        </p>
      </section>

      {/* Arrived outside the geofence → reason → flagged for review (rule 2) */}
      <ArrivedReasonDialog
        open={!!arrivedPrompt}
        distanceM={arrivedPrompt?.distanceM ?? null}
        busy={busy === "arrived"}
        onClose={() => setArrivedPrompt(null)}
        onSubmit={async (reason) => {
          setArrivedPrompt(null);
          await arrived(reason);
        }}
      />

      <Dialog open={confirmDeliver} onOpenChange={setConfirmDeliver}>
        <DialogContent>
          <DialogTitle>{job ? t.rider.confirmDelivered(job.collectPkr) : ""}</DialogTitle>
          <DialogDescription>{job?.code}</DialogDescription>
          <Button
            size="xl"
            variant="success"
            disabled={busy === "delivered"}
            onClick={async () => {
              if (!job) return;
              setConfirmDeliver(false);
              await act("delivered", () => api<RiderState>(`/api/rider/jobs/${job.id}/delivered`, { json: {} }));
            }}
          >
            <CheckCircle2 /> {t.common.confirm}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-muted p-2">
      <p className="tabular font-display text-lg font-extrabold">{value}</p>
      <p className="text-[11px] font-semibold text-ink-soft">{label}</p>
    </div>
  );
}

function Stop({
  icon,
  label,
  title,
  subtitle,
  active,
  done,
  phone,
  phoneLabel,
  maps,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle: string;
  active: boolean;
  done: boolean;
  phone: string | null;
  phoneLabel: string;
  maps: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-3xl bg-card p-4 shadow-soft", active && "ring-2 ring-brand", done && "opacity-55")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", active ? "bg-brand text-brand-ink" : "bg-muted")}>{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{label}</p>
          <p className="truncate font-display text-lg font-bold">{title}</p>
          <p className="text-sm text-ink-soft">{subtitle}</p>
        </div>
      </div>
      {children}
      {!done && (
        <div className="mt-3 flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <a href={maps} target="_blank" rel="noreferrer">
              <Navigation /> {t.rider.openMaps}
            </a>
          </Button>
          {phone && (
            <Button asChild variant="soft" size="icon" aria-label={phoneLabel}>
              <a href={`tel:${phone}`}>
                <Phone />
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ArrivedReasonDialog({
  open,
  distanceM,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  distanceM: number | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const final = reason === "Other" ? other.trim() : reason;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>{t.rider.arrivedFarTitle}</DialogTitle>
        <DialogDescription>{t.rider.arrivedFarBody(distanceM)}</DialogDescription>
        <div className="grid gap-2">
          {t.rider.arrivedReasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              className={cn("h-12 rounded-2xl border px-4 text-left font-semibold", reason === r ? "border-brand bg-brand-soft/50" : "border-line")}
            >
              {r}
            </button>
          ))}
          {reason === "Other" && <Input autoFocus value={other} onChange={(e) => setOther(e.target.value)} placeholder="…" />}
        </div>
        <Button size="lg" variant="ink" disabled={!final || busy} onClick={() => final && onSubmit(final)}>
          {t.rider.arrived}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
