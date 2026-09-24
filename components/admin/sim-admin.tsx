"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FastForward, Loader2, Play, Radio, Sparkles, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { syncServerClock } from "@/lib/client/server-clock";
import { cn } from "@/lib/utils";
import { AdminHeader } from "./admin-shell";

type SimState = { simRunning: boolean; devToolsEnabled: boolean; warp: number; activeSimOrders: number };

export function SimAdmin({ restaurants }: { restaurants: { id: string; name: string }[] }) {
  const [state, setState] = useState<SimState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [count, setCount] = useState(3);
  const [restaurantId, setRestaurantId] = useState("");
  const [slowKitchen, setSlowKitchen] = useState(0);
  const [slowRider, setSlowRider] = useState(1);
  const [log, setLog] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setState(await api<SimState>("/api/admin/sim"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    api<SimState>("/api/admin/sim").then(setState).catch(() => {});
    const id = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(id);
  }, [load]);

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    try {
      const r = await api<{ results?: { ok: boolean; restaurant?: string; message?: string }[]; deleted?: number; riders?: number }>("/api/admin/sim", {
        json: { action, ...extra },
      });
      if (r.results) setLog((l) => [...r.results!.map((x) => (x.ok ? `✓ order at ${x.restaurant}` : `✗ ${x.message}`)), ...l].slice(0, 30));
      if (action === "cleanup") toast.success(`Cleaned up ${r.deleted ?? 0} test orders; clock back to real time.`);
      if (action === "warp") await syncServerClock(true);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const disabled = !state?.devToolsEnabled;

  return (
    <div className="max-w-4xl">
      <AdminHeader
        title="Simulation"
        subtitle="Dev only. A pretend kitchen accepts and cooks; simulated riders drive the route at the ETA model's speed. Everything runs on app time."
      />
      {disabled && (
        <p className="mb-4 rounded-2xl bg-amber/15 px-4 py-3 font-semibold">
          Dev tools are off. Turn them on in <Link href="/admin/settings" className="underline">Settings</Link>.
        </p>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <p className="text-xs font-semibold text-ink-soft">Simulator</p>
          <p className={cn("font-display text-2xl font-extrabold", state?.simRunning ? "text-mint-deep" : "text-ink-soft")}>{state?.simRunning ? "Running" : "Stopped"}</p>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <p className="text-xs font-semibold text-ink-soft">Clock</p>
          <p className="font-display text-2xl font-extrabold">{state?.warp && state.warp !== 1 ? `⏩ ${state.warp}×` : "Real time"}</p>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <p className="text-xs font-semibold text-ink-soft">Live test orders</p>
          <p className="font-display text-2xl font-extrabold">{state?.activeSimOrders ?? "—"}</p>
        </div>
      </div>

      <section className="mb-5 rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="mb-3 font-display text-lg font-bold">1 · Run the simulator</h2>
        <div className="flex flex-wrap gap-2">
          {state?.simRunning ? (
            <Button variant="outline" onClick={() => run("stop")} disabled={!!busy || disabled}>
              <Square /> Stop
            </Button>
          ) : (
            <Button onClick={() => run("start")} disabled={!!busy || disabled}>
              {busy === "start" ? <Loader2 className="animate-spin" /> : <Play />} Start (puts test riders online)
            </Button>
          )}
          <Button variant="outline" onClick={() => run("riders_online")} disabled={!!busy || disabled}>
            <Radio /> Test riders online
          </Button>
        </div>
      </section>

      <section className="mb-5 rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="mb-3 font-display text-lg font-bold">2 · Spawn test orders</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="grid gap-1.5">
            <Label htmlFor="count">How many</Label>
            <Input id="count" type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rest">Restaurant</Label>
            <select id="rest" value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className="h-12 rounded-2xl border border-line bg-card px-3">
              <option value="">Any open kitchen</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="slowk">Kitchen runs late by (min)</Label>
            <Input id="slowk" type="number" min={0} max={60} value={slowKitchen} onChange={(e) => setSlowKitchen(Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="slowr">Rider slowness (×)</Label>
            <Input id="slowr" type="number" min={1} max={5} step={0.25} value={slowRider} onChange={(e) => setSlowRider(Number(e.target.value))} />
          </div>
        </div>
        <Button
          className="mt-3"
          onClick={() => run("spawn", { count, restaurantId: restaurantId || null, slowKitchenMin: slowKitchen || undefined, slowRiderFactor: slowRider > 1 ? slowRider : undefined })}
          disabled={!!busy || disabled}
        >
          {busy === "spawn" ? <Loader2 className="animate-spin" /> : <Sparkles />} Spawn
        </Button>
        {log.length > 0 && (
          <ul className="mt-3 max-h-40 overflow-y-auto rounded-2xl bg-muted p-3 font-mono text-xs">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink-soft">
          Watch them on the <Link href="/admin" className="font-semibold underline">Live board</Link>. Test orders are excluded from analytics unless you tick “Include test orders”.
        </p>
      </section>

      <section className="mb-5 rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="mb-1 font-display text-lg font-bold">3 · Time warp</h2>
        <p className="mb-3 text-sm text-ink-soft">Speeds up the whole app clock (DB app time + every countdown). 10× turns 30 minutes into 3.</p>
        <div className="flex flex-wrap gap-2">
          {[1, 5, 10, 30].map((f) => (
            <Button key={f} variant={state?.warp === f ? "ink" : "outline"} onClick={() => run("warp", { factor: f })} disabled={!!busy || (disabled && f !== 1)}>
              <FastForward /> {f === 1 ? "Real time" : `${f}×`}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">Turning warp off snaps back to real time — clean up warped test orders afterwards.</p>
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="mb-3 font-display text-lg font-bold">4 · Clean up</h2>
        <Button variant="destructive" onClick={() => run("cleanup")} disabled={!!busy || disabled}>
          {busy === "cleanup" ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete test orders, stop sim, real time
        </Button>
      </section>
    </div>
  );
}
