"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatPkPhone } from "@/lib/auth/phone";
import { api } from "@/lib/client/api";
import type { Tables } from "@/lib/supabase/database.types";
import { AdminHeader } from "./admin-shell";

type Rider = Tables<"riders"> & { profiles: { full_name: string; phone: string | null } | null };

function ago(iso: string | null) {
  if (!iso) return "never";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}

export function RidersAdmin() {
  const [riders, setRiders] = useState<Rider[] | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => setRiders((await api<{ riders: Rider[] }>("/api/admin/riders")).riders), []);
  useEffect(() => {
    api<{ riders: Rider[] }>("/api/admin/riders")
      .then((r) => setRiders(r.riders))
      .catch(() => {});
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await api(`/api/admin/riders/${id}`, { method: "PATCH", json: body });
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Riders"
        subtitle="Pay per job is fixed (base + per km) and never cut for lateness."
        right={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Add rider
          </Button>
        }
      />
      {!riders ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-card shadow-soft">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-xs tracking-wider text-ink-soft uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Rider</th>
                <th className="px-2 py-3 font-semibold">Status</th>
                <th className="px-2 py-3 font-semibold">Bike</th>
                <th className="px-2 py-3 font-semibold">Last GPS</th>
                <th className="px-2 py-3 font-semibold">Active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {riders.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3">
                    <p className="font-bold">
                      {r.profiles?.full_name} {r.is_test && <Badge variant="muted">test</Badge>}
                    </p>
                    <p className="tabular text-xs text-ink-soft">{formatPkPhone(r.profiles?.phone)}</p>
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant={r.status === "busy" ? "default" : r.status === "idle" ? "mint" : "muted"}>{r.status === "busy" ? "on a job" : r.status}</Badge>
                  </td>
                  <td className="px-2 py-3 text-ink-soft">
                    {r.vehicle}
                    {r.plate ? ` · ${r.plate}` : ""}
                  </td>
                  <td className="tabular px-2 py-3 text-ink-soft">{ago(r.last_seen_at)}</td>
                  <td className="px-2 py-3">
                    <Switch checked={r.is_active} onCheckedChange={(v) => patch(r.id, { is_active: v })} aria-label="Active" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "idle" && (
                      <Button size="sm" variant="ghost" onClick={() => patch(r.id, { forceOffline: true })}>
                        Set offline
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CreateRider open={creating} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); void load(); }} />
    </div>
  );
}

function CreateRider({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ fullName: "", phone: "", password: "", vehicle: "Honda CD-70", plate: "" });
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await api("/api/admin/riders", { json: { ...f, plate: f.plate || null } });
      toast.success("Rider added — share the phone + password with them.");
      setF({ fullName: "", phone: "", password: "", vehicle: "Honda CD-70", plate: "" });
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="grid gap-3 px-5 pb-8">
          <DrawerTitle className="mt-2">Add rider</DrawerTitle>
          <DrawerDescription>They sign in at /login and land on the rider app.</DrawerDescription>
          <Input placeholder="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
          <Input placeholder="Phone 0300 1234567" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input placeholder="Temporary password (6+ chars)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Bike" value={f.vehicle} onChange={(e) => setF({ ...f, vehicle: e.target.value })} />
            <Input placeholder="Plate (LEA-1234)" value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} />
          </div>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Create rider
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
