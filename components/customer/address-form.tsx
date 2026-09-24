"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bell, Crosshair, Loader2, PhoneCall, ShieldCheck, TriangleAlert, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { WaqtMap } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DHA_PHASES, type GateNoteKind } from "@/config/dha";
import { api } from "@/lib/client/api";
import { pointInPolygon, type LatLng, type Polygon } from "@/lib/geo";
import { t } from "@/lib/i18n";
import type { AddressRow } from "@/lib/server/catalog";
import { cn, haptic } from "@/lib/utils";
import { PageHeader } from "./page-header";

const GATE_ICONS: Record<GateNoteKind, typeof Bell> = { guard: ShieldCheck, bell: Bell, call: PhoneCall, custom: PencilLine };

export function AddressForm({ zones, next, initial }: { zones: Polygon[]; next: string; initial?: AddressRow }) {
  const router = useRouter();
  const [phase, setPhase] = useState(initial?.phase ?? "");
  const [block, setBlock] = useState(initial?.block ?? "");
  const [house, setHouse] = useState(initial?.house_no ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [label, setLabel] = useState(initial?.label ?? "Home");
  const [gateKind, setGateKind] = useState<GateNoteKind>((initial?.gate_note_kind as GateNoteKind) ?? "call");
  const [gateCustom, setGateCustom] = useState(initial?.gate_note_kind === "custom" ? (initial?.gate_note ?? "") : "");
  const [pin, setPin] = useState<LatLng | null>(initial ? { lat: initial.lat, lng: initial.lng } : null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const phaseInfo = DHA_PHASES.find((p) => p.name === phase);
  const center: LatLng = pin ?? (phaseInfo ? { lat: phaseInfo.center[0], lng: phaseInfo.center[1] } : { lat: 31.4697, lng: 74.4115 });
  const inZone = pin ? zones.some((z) => pointInPolygon(pin, z)) : true;
  const polygons = useMemo(() => zones.map((z, i) => ({ id: `z${i}`, points: z.map(([lat, lng]) => ({ lat, lng })) })), [zones]);

  function choosePhase(name: string) {
    setPhase(name);
    setBlock("");
    const p = DHA_PHASES.find((x) => x.name === name);
    if (p && !initial) setPin({ lat: p.center[0], lng: p.center[1] });
  }

  function locate() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        haptic();
      },
      () => {
        toast.error(t.rider.locationDenied);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function save() {
    if (!phase || !block.trim() || !house.trim() || !pin) return toast.error(t.address.required);
    setSaving(true);
    const gateNote = gateKind === "custom" ? gateCustom.trim() || null : t.address.gateKinds[gateKind];
    const body = {
      label,
      phase,
      block: block.trim(),
      house_no: house.trim(),
      street: street.trim() || null,
      lat: pin.lat,
      lng: pin.lng,
      gate_note_kind: gateKind,
      gate_note: gateNote,
    };
    try {
      if (initial) await api(`/api/addresses/${initial.id}`, { method: "PATCH", json: body });
      else await api("/api/addresses", { json: body });
      toast.success(t.common.saved);
      router.replace(next);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="pb-32">
      <PageHeader title={initial ? t.address.title : t.address.newTitle} />
      <div className="space-y-5 px-5">
        {/* Phase */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t.address.phase}</legend>
          <div className="grid grid-cols-4 gap-2">
            {DHA_PHASES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => choosePhase(p.name)}
                aria-pressed={phase === p.name}
                className={cn(
                  "h-11 rounded-xl text-sm font-bold transition-colors",
                  phase === p.name ? "bg-ink text-cream" : "bg-card shadow-soft",
                )}
              >
                {p.name.replace("Phase ", "P")}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Block */}
        {phaseInfo && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t.address.block}</legend>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
              {phaseInfo.blocks.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBlock(b)}
                  aria-pressed={block === b}
                  className={cn(
                    "h-11 min-w-11 shrink-0 rounded-xl px-3 text-sm font-bold transition-colors",
                    block === b ? "bg-brand text-brand-ink" : "bg-card shadow-soft",
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="house">{t.address.house}</Label>
            <Input id="house" inputMode="text" placeholder={t.address.housePlaceholder} value={house} onChange={(e) => setHouse(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="street">{t.address.street}</Label>
            <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
          </div>
        </div>

        {/* Pin */}
        <section>
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <h2 className="font-bold">{t.address.pinTitle}</h2>
              <p className="text-xs text-ink-soft">{t.address.pinBody}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={locate} disabled={locating}>
              {locating ? <Loader2 className="animate-spin" /> : <Crosshair />} {t.address.locateMe}
            </Button>
          </div>
          <WaqtMap
            className="h-72 rounded-3xl"
            center={center}
            zoom={16}
            followCenter
            polygons={polygons}
            onClick={(p) => setPin(p)}
            markers={
              pin
                ? [{ id: "pin", kind: "pin", position: pin, label: "🏠", draggable: true, onDragEnd: (p) => { setPin(p); haptic(); } }]
                : []
            }
          />
          {!inZone && (
            <p className="mt-2 flex items-center gap-2 rounded-2xl bg-chili/10 px-3 py-2 text-sm font-semibold text-chili">
              <TriangleAlert className="size-4" /> {t.address.outsideZone}
            </p>
          )}
        </section>

        {/* Gate note */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t.address.gateNote}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(t.address.gateKinds) as GateNoteKind[]).map((k) => {
              const Icon = GATE_ICONS[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setGateKind(k)}
                  aria-pressed={gateKind === k}
                  className={cn(
                    "flex h-12 items-center gap-2 rounded-2xl border px-3 text-left text-sm font-semibold transition-colors",
                    gateKind === k ? "border-brand bg-brand-soft/50" : "border-line bg-card",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-brand" /> {t.address.gateKinds[k]}
                </button>
              );
            })}
          </div>
          {gateKind === "custom" && (
            <Input className="mt-2" placeholder={t.address.gateCustom} value={gateCustom} maxLength={200} onChange={(e) => setGateCustom(e.target.value)} />
          )}
        </fieldset>

        {/* Label */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t.address.label}</legend>
          <div className="flex gap-2">
            {t.address.labels.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLabel(l)}
                aria-pressed={label === l}
                className={cn("h-10 rounded-full px-4 text-sm font-bold", label === l ? "bg-ink text-cream" : "bg-card shadow-soft")}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md bg-gradient-to-t from-cream via-cream to-cream/0 px-4 pt-6">
        <Button size="xl" className="w-full" onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" />} {t.address.save}
        </Button>
      </div>
    </div>
  );
}
