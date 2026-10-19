"use client";

import { useState } from "react";
import { CloudRain, FlaskConical, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/client/api";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { AdminHeader } from "./admin-shell";

type S = Tables<"app_settings">;
type NumKey = { [K in keyof S]: S[K] extends number ? K : never }[keyof S];

/** Rule 12 — every number the guarantee uses, editable here. */
const GROUPS: { title: string; note?: string; fields: { key: NumKey; label: string; unit: string; step?: number }[] }[] = [
  {
    title: "The promise",
    fields: [
      { key: "guarantee_window_min", label: "Guarantee window", unit: "min" },
      { key: "max_eta_min", label: "Max predicted ETA to accept an order (safety buffer)", unit: "min" },
      { key: "free_cap_pkr", label: "Free-order cap", unit: "Rs" },
      { key: "accept_timeout_sec", label: "Restaurant must accept within", unit: "sec" },
      { key: "geofence_m", label: "Arrived geofence", unit: "m" },
      { key: "fast_lane_max_prep_min", label: "Fast-lane max prep per item", unit: "min" },
      { key: "kitchen_charge_pct", label: "Charge to kitchen for kitchen-caused lates", unit: "%" },
    ],
  },
  {
    title: "ETA model",
    note: "ETA = accept buffer + max(prep + queue, rider → kitchen) + ride (km × route factor at speed) + handoff",
    fields: [
      { key: "accept_buffer_min", label: "Accept buffer", unit: "min" },
      { key: "handoff_min", label: "Handoff", unit: "min" },
      { key: "rider_speed_kmh", label: "Rider speed", unit: "km/h", step: 0.5 },
      { key: "route_factor", label: "Route factor (road vs straight line)", unit: "×", step: 0.05 },
      { key: "queue_penalty_min", label: "Queue penalty per order in the kitchen", unit: "min" },
      { key: "rider_soon_free_min", label: "Count riders free within", unit: "min" },
      { key: "rider_stale_sec", label: "Rider GPS counts as fresh for", unit: "sec" },
    ],
  },
  {
    title: "Coverage & money",
    fields: [
      { key: "restaurant_radius_km", label: "Default restaurant radius", unit: "km", step: 0.5 },
      { key: "delivery_fee_pkr", label: "Delivery fee", unit: "Rs" },
      { key: "rider_base_pay_pkr", label: "Rider pay per job (base)", unit: "Rs" },
      { key: "rider_per_km_pkr", label: "Rider pay per road km", unit: "Rs" },
    ],
  },
  {
    title: "Rain Mode & misc",
    fields: [
      { key: "rain_extra_min", label: "Rain Mode: extra minutes on the honest ETA", unit: "min" },
      { key: "location_broadcast_sec", label: "Rider GPS broadcast every", unit: "sec" },
      { key: "location_save_sec", label: "Rider GPS saved every", unit: "sec" },
      { key: "on_time_score_min_deliveries", label: "Show on-time score after", unit: "deliveries" },
    ],
  },
];

export function SettingsAdmin({ initial }: { initial: S }) {
  const [s, setS] = useState(initial);
  const [dirty, setDirty] = useState<Partial<S>>({});
  const [busy, setBusy] = useState(false);

  function set<K extends keyof S>(key: K, value: S[K]) {
    setS((c) => ({ ...c, [key]: value }));
    setDirty((d) => ({ ...d, [key]: value }));
  }

  async function save(patch: Partial<S> = dirty) {
    if (!Object.keys(patch).length) return;
    setBusy(true);
    try {
      const r = await api<{ settings: S }>("/api/admin/settings", { method: "PATCH", json: patch });
      setS(r.settings);
      setDirty({});
      toast.success("Settings saved — live immediately.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl pb-24">
      <AdminHeader title="Settings" subtitle="Every number the guarantee uses (rule 12). Changes apply to new orders immediately." />

      <div className={cn("mb-5 flex items-center gap-4 rounded-3xl p-5 shadow-soft", s.rain_mode ? "bg-ink text-cream" : "bg-card")}>
        <CloudRain className={cn("size-8 shrink-0", s.rain_mode ? "text-brand" : "text-ink-soft")} />
        <div className="flex-1">
          <p className="font-display text-xl font-bold">Rain Mode</p>
          <p className={cn("text-sm", s.rain_mode ? "text-cream/75" : "text-ink-soft")}>
            Pauses the guarantee app-wide. Orders still allowed, marked “No timer right now” with an honest ETA (+{s.rain_extra_min} min).
          </p>
        </div>
        <Switch checked={s.rain_mode} onCheckedChange={(v) => { set("rain_mode", v); void save({ rain_mode: v }); }} aria-label="Rain Mode" />
      </div>

      {GROUPS.map((g) => (
        <section key={g.title} className="mb-5 rounded-3xl bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold">{g.title}</h2>
          {g.note && <p className="text-xs text-ink-soft">{g.note}</p>}
          <div className="mt-3 grid gap-x-6 gap-y-3 md:grid-cols-2">
            {g.fields.map((f) => (
              <label key={f.key} className="flex items-center justify-between gap-3">
                <span className="text-sm">{f.label}</span>
                <span className="flex items-center gap-2">
                  <Input
                    type="number"
                    step={f.step ?? 1}
                    className="h-10 w-24 text-right tabular-nums"
                    value={String(s[f.key])}
                    onChange={(e) => set(f.key, Number(e.target.value) as S[typeof f.key])}
                  />
                  <span className="w-10 text-xs text-ink-soft">{f.unit}</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-5 flex items-center gap-4 rounded-3xl bg-card p-5 shadow-soft">
        <FlaskConical className="size-7 text-ink-soft" />
        <div className="flex-1">
          <p className="font-bold">Dev tools (simulation, time warp, test-order reset)</p>
          <p className="text-sm text-ink-soft">Must be OFF for the real pilot. Also set NEXT_PUBLIC_DEV_TOOLS=false on the server.</p>
        </div>
        <Switch checked={s.dev_tools_enabled} onCheckedChange={(v) => { set("dev_tools_enabled", v); void save({ dev_tools_enabled: v }); }} aria-label="Dev tools" />
      </section>

      {Object.keys(dirty).length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <Button size="lg" variant="ink" className="shadow-lift" onClick={() => save()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Save />} Save {Object.keys(dirty).length} change{Object.keys(dirty).length > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
