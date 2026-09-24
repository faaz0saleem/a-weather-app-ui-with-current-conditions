"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Pause, Play, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { FoodArt } from "@/components/brand/food-art";
import { WaqtMap } from "@/components/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatPkPhone } from "@/lib/auth/phone";
import { api } from "@/lib/client/api";
import { formatTime } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import { AdminHeader } from "./admin-shell";

type R = Tables<"restaurants">;
type Staff = { id: string; full_name: string; phone: string | null; restaurant_id: string | null };

export function RestaurantsAdmin() {
  const [data, setData] = useState<{ restaurants: R[]; staff: Staff[]; loadedAt: number } | null>(null);
  const [editing, setEditing] = useState<Partial<R> | null>(null);
  const [staffFor, setStaffFor] = useState<R | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ restaurants: R[]; staff: Staff[] }>("/api/admin/restaurants");
    setData({ ...r, loadedAt: Date.now() });
  }, []);
  useEffect(() => {
    api<{ restaurants: R[]; staff: Staff[] }>("/api/admin/restaurants")
      .then((r) => setData({ ...r, loadedAt: Date.now() }))
      .catch(() => {});
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await api(`/api/admin/restaurants/${id}`, { method: "PATCH", json: body });
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const now = data?.loadedAt ?? 0;
  return (
    <div>
      <AdminHeader
        title="Restaurants"
        subtitle="Pause any kitchen, edit coverage and hours, add kitchen logins, or open their dashboard."
        right={
          <Button onClick={() => setEditing({ opens_at: "11:00", closes_at: "02:00", hero_emoji: "🍽️", hero_from: "#F08A24", hero_to: "#7A2E0E", lat: 31.4697, lng: 74.4115, cuisines: [] })}>
            <Plus /> New restaurant
          </Button>
        }
      />
      {!data ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.restaurants.map((r) => {
            const paused = r.paused_until && new Date(r.paused_until).getTime() > now;
            const staff = data.staff.filter((s) => s.restaurant_id === r.id);
            return (
              <li key={r.id} className="overflow-hidden rounded-3xl bg-card shadow-soft">
                <div className="flex gap-3 p-4">
                  <FoodArt emoji={r.hero_emoji} from={r.hero_from} to={r.hero_to} size="sm" className="size-16 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-bold">
                      {r.name} {!r.is_active && <Badge variant="muted">hidden</Badge>}
                      {paused && <Badge variant="amber">paused</Badge>}
                      {!r.is_accepting && <Badge variant="chili">closed</Badge>}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {r.cluster} · {r.opens_at.slice(0, 5)}–{r.closes_at.slice(0, 5)} · {r.radius_km ?? "default"} km
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {staff.length ? staff.map((s) => `${s.full_name} ${formatPkPhone(s.phone)}`).join(", ") : "No kitchen login yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
                  {paused ? (
                    <Button size="sm" variant="soft" onClick={() => patch(r.id, { pauseMin: 0 })}>
                      <Play /> Resume ({formatTime(r.paused_until!)})
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => patch(r.id, { pauseMin: 30 })}>
                      <Pause /> Pause 30 min
                    </Button>
                  )}
                  <label className="flex items-center gap-1.5 text-xs font-semibold">
                    <Switch checked={r.is_active} onCheckedChange={(v) => patch(r.id, { is_active: v })} /> Listed
                  </label>
                  <div className="ml-auto flex gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label="Add kitchen login" onClick={() => setStaffFor(r)}>
                      <UserPlus className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                      Edit
                    </Button>
                    <Button asChild size="icon-sm" variant="ghost" aria-label="Open kitchen dashboard">
                      <Link href={`/restaurant?r=${r.id}`}>
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <RestaurantEditor value={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />
      <StaffDialog restaurant={staffFor} onClose={() => setStaffFor(null)} onSaved={() => { setStaffFor(null); void load(); }} />
    </div>
  );
}

function RestaurantEditor({ value, onClose, onSaved }: { value: Partial<R> | null; onClose: () => void; onSaved: () => void }) {
  return (
    <Drawer open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-2xl">{value && <RestaurantForm key={value.id ?? "new"} initial={value} onSaved={onSaved} />}</DrawerContent>
    </Drawer>
  );
}

function RestaurantForm({ initial, onSaved }: { initial: Partial<R>; onSaved: () => void }) {
  const [f, setF] = useState({
    name: initial.name ?? "",
    slug: initial.slug ?? "",
    tagline: initial.tagline ?? "",
    cuisines: (initial.cuisines ?? []).join(", "),
    cluster: initial.cluster ?? "",
    address: initial.address ?? "",
    phone: initial.phone ?? "",
    radius_km: initial.radius_km != null ? String(initial.radius_km) : "",
    opens_at: (initial.opens_at ?? "11:00").slice(0, 5),
    closes_at: (initial.closes_at ?? "02:00").slice(0, 5),
    hero_emoji: initial.hero_emoji ?? "🍽️",
    hero_from: initial.hero_from ?? "#F08A24",
    hero_to: initial.hero_to ?? "#7A2E0E",
    lat: initial.lat ?? 31.4697,
    lng: initial.lng ?? 74.4115,
    staffName: "",
    staffPhone: "",
    staffPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<typeof f>) => setF((c) => ({ ...c, ...p }));

  async function save() {
    setBusy(true);
    const body: Record<string, unknown> = {
      name: f.name,
      slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      tagline: f.tagline,
      cuisines: f.cuisines.split(",").map((c) => c.trim()).filter(Boolean),
      cluster: f.cluster,
      address: f.address,
      phone: f.phone || null,
      radius_km: f.radius_km ? Number(f.radius_km) : null,
      opens_at: f.opens_at,
      closes_at: f.closes_at,
      hero_emoji: f.hero_emoji,
      hero_from: f.hero_from,
      hero_to: f.hero_to,
      lat: f.lat,
      lng: f.lng,
    };
    if (!initial.id && f.staffPhone) body.staff = { fullName: f.staffName || `${f.name} Kitchen`, phone: f.staffPhone, password: f.staffPassword };
    try {
      if (initial.id) await api(`/api/admin/restaurants/${initial.id}`, { method: "PATCH", json: body });
      else await api("/api/admin/restaurants", { json: body });
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof typeof f, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`rf-${key}`}>{label}</Label>
      <Input id={`rf-${key}`} value={String(f[key])} onChange={(e) => set({ [key]: e.target.value } as Partial<typeof f>)} {...props} />
    </div>
  );

  return (
    <div className="overflow-y-auto px-5 pb-8">
      <DrawerTitle className="mt-2">{initial.id ? `Edit ${initial.name}` : "New restaurant"}</DrawerTitle>
      <DrawerDescription className="mb-4">Drag the pin to the kitchen&apos;s pickup door. Radius blank = default setting.</DrawerDescription>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", "Name")}
        {field("slug", "URL slug", { placeholder: "auto from name" })}
        {field("tagline", "Tagline")}
        {field("cuisines", "Cuisines (comma separated)")}
        {field("cluster", "Area / cluster", { placeholder: "Y Block, Phase 3" })}
        {field("address", "Address")}
        {field("phone", "Kitchen phone")}
        {field("radius_km", "Delivery radius (km)", { type: "number", step: "0.5" })}
        {field("opens_at", "Opens (PKT)", { type: "time" })}
        {field("closes_at", "Closes (PKT)", { type: "time" })}
        {field("hero_emoji", "Placeholder emoji")}
        <div className="grid grid-cols-2 gap-2">
          {field("hero_from", "Gradient from", { type: "color", className: "h-12 p-1" })}
          {field("hero_to", "Gradient to", { type: "color", className: "h-12 p-1" })}
        </div>
      </div>
      <WaqtMap
        className="mt-4 h-64 rounded-2xl"
        center={{ lat: f.lat, lng: f.lng }}
        zoom={15}
        onClick={(p) => set({ lat: p.lat, lng: p.lng })}
        markers={[{ id: "k", kind: "pin", position: { lat: f.lat, lng: f.lng }, label: f.hero_emoji, draggable: true, onDragEnd: (p) => set({ lat: p.lat, lng: p.lng }) }]}
      />
      {!initial.id && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-muted p-4 sm:grid-cols-3">
          <p className="text-sm font-semibold sm:col-span-3">Kitchen login (optional)</p>
          {field("staffName", "Staff name")}
          {field("staffPhone", "Phone", { type: "tel", placeholder: "0300 1234567" })}
          {field("staffPassword", "Temporary password", { type: "text" })}
        </div>
      )}
      <Button size="lg" className="mt-4 w-full" onClick={save} disabled={busy || !f.name}>
        {busy && <Loader2 className="animate-spin" />} Save
      </Button>
    </div>
  );
}

function StaffDialog({ restaurant, onClose, onSaved }: { restaurant: R | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ fullName: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!restaurant) return;
    setBusy(true);
    try {
      await api(`/api/admin/restaurants/${restaurant.id}`, { json: f });
      toast.success("Kitchen login created — share the phone + password with the restaurant.");
      setF({ fullName: "", phone: "", password: "" });
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer open={!!restaurant} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="grid gap-3 px-5 pb-8">
          <DrawerTitle className="mt-2">Add kitchen login · {restaurant?.name}</DrawerTitle>
          <DrawerDescription>They sign in at /login with this phone + password.</DrawerDescription>
          <Input placeholder="Name (e.g. Counter tablet)" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
          <Input placeholder="Phone 0300 1234567" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input placeholder="Temporary password (6+ chars)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Create login
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
