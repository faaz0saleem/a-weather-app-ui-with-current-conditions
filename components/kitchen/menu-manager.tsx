"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { compressImage } from "@/lib/client/image";
import { formatPKR } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Item = Tables<"menu_items">;
type Section = Tables<"menu_sections">;

export function MenuManager({ query }: { query: string }) {
  const [data, setData] = useState<{ sections: Section[]; items: Item[]; fastLaneMaxPrepMin: number } | null>(null);
  const [editing, setEditing] = useState<Partial<Item> | null>(null);

  const load = useCallback(async () => {
    setData(await api(`/api/restaurant/menu${query}`));
  }, [query]);
  useEffect(() => {
    api<{ sections: Section[]; items: Item[]; fastLaneMaxPrepMin: number }>(`/api/restaurant/menu${query}`).then(setData).catch(() => {});
  }, [query]);

  async function toggleStock(item: Item, on: boolean) {
    setData((d) => d && { ...d, items: d.items.map((i) => (i.id === item.id ? { ...i, is_available: on } : i)) });
    try {
      await api(`/api/restaurant/menu/${item.id}${query}`, { method: "PATCH", json: { is_available: on } });
    } catch (e) {
      toast.error((e as Error).message);
      void load();
    }
  }

  if (!data)
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );

  const max = data.fastLaneMaxPrepMin;
  const groups = [...data.sections.map((s) => ({ id: s.id as string | null, name: s.name })), { id: null, name: "More" }];

  return (
    <div className="max-w-3xl">
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing({ name: "", price_pkr: 0, prep_min: 8, emoji: "🍽️", description: "", section_id: data.sections[0]?.id ?? null, is_available: true })}>
          <Plus /> {t.kitchen.menu.addItem}
        </Button>
      </div>
      {groups.map((g) => {
        const items = data.items.filter((i) => (i.section_id ?? null) === g.id);
        if (!items.length) return null;
        return (
          <section key={g.id ?? "more"} className="mb-5">
            <h3 className="mb-2 font-display text-lg font-bold">{g.name}</h3>
            <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card shadow-soft">
              {items.map((i) => (
                <li key={i.id} className={cn("flex items-center gap-3 p-3", !i.is_available && "opacity-60")}>
                  <button onClick={() => setEditing(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {i.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image_url} alt="" className="size-12 rounded-xl object-cover" />
                    ) : (
                      <span className="grid size-12 place-items-center rounded-xl bg-muted text-2xl">{i.emoji}</span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{i.name}</span>
                      <span className="tabular flex items-center gap-2 text-sm text-ink-soft">
                        {formatPKR(i.price_pkr)} · {i.prep_min} min
                        {i.prep_min <= max ? (
                          <Badge variant="mint">
                            <Zap /> {t.kitchen.menu.fastLane}
                          </Badge>
                        ) : (
                          <Badge variant="chili">{`>${max} min · hidden`}</Badge>
                        )}
                      </span>
                    </span>
                  </button>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                    {i.is_available ? t.kitchen.menu.inStock : t.kitchen.menu.soldOut}
                    <Switch checked={i.is_available} onCheckedChange={(v) => toggleStock(i, v)} aria-label={`${i.name} ${t.kitchen.menu.inStock}`} />
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <ItemEditor
        item={editing}
        sections={data.sections}
        fastLaneMax={max}
        query={query}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
    </div>
  );
}

function ItemEditor({
  item,
  sections,
  fastLaneMax,
  query,
  onClose,
  onSaved,
}: {
  item: Partial<Item> | null;
  sections: Section[];
  fastLaneMax: number;
  query: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Drawer open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        {item && <ItemForm key={item.id ?? "new"} item={item} sections={sections} fastLaneMax={fastLaneMax} query={query} onSaved={onSaved} />}
      </DrawerContent>
    </Drawer>
  );
}

function ItemForm({
  item,
  sections,
  fastLaneMax,
  query,
  onSaved,
}: {
  item: Partial<Item>;
  sections: Section[];
  fastLaneMax: number;
  query: string;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    name: item.name ?? "",
    description: item.description ?? "",
    price_pkr: item.price_pkr ?? 0,
    prep_min: item.prep_min ?? 8,
    emoji: item.emoji ?? "🍽️",
    section_id: item.section_id ?? null,
    is_popular: item.is_popular ?? false,
    options: JSON.stringify(item.option_groups ?? [], null, 2),
  });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<typeof f>) => setF((cur) => ({ ...cur, ...patch }));

  async function save() {
    let option_groups: unknown;
    try {
      option_groups = JSON.parse(f.options || "[]");
    } catch {
      return toast.error("Options must be valid JSON.");
    }
    setBusy(true);
    const body = {
      name: f.name,
      description: f.description,
      price_pkr: Number(f.price_pkr),
      prep_min: Number(f.prep_min),
      emoji: f.emoji,
      section_id: f.section_id,
      is_popular: f.is_popular,
      option_groups,
    };
    try {
      if (item.id) await api(`/api/restaurant/menu/${item.id}${query}`, { method: "PATCH", json: body });
      else await api(`/api/restaurant/menu${query}`, { json: body });
      toast.success(t.common.saved);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file || !item.id) return;
    setBusy(true);
    const form = new FormData();
    form.set("photo", new File([await compressImage(file)], "item.jpg", { type: "image/jpeg" }));
    try {
      await api(`/api/restaurant/menu/${item.id}${query}`, { method: "POST", body: form });
      toast.success(t.common.saved);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!item.id) return;
    await api(`/api/restaurant/menu/${item.id}${query}`, { method: "PATCH", json: { is_active: false } });
    onSaved();
  }

  const fast = Number(f.prep_min) <= fastLaneMax;

  return (
    <div className="overflow-y-auto px-5 pb-8">
      <DrawerTitle className="mt-2">{item.id ? t.kitchen.menu.editItem : t.kitchen.menu.addItem}</DrawerTitle>
      <DrawerDescription className="mb-4">{fast ? t.kitchen.menu.fastLane : t.kitchen.menu.notFastLane(fastLaneMax)}</DrawerDescription>
      <div className="grid gap-3">
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="emoji">{t.kitchen.menu.emoji}</Label>
            <Input id="emoji" value={f.emoji} onChange={(e) => set({ emoji: e.target.value })} className="text-center text-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="name">{t.kitchen.menu.name}</Label>
            <Input id="name" value={f.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="desc">{t.kitchen.menu.description}</Label>
          <Textarea id="desc" value={f.description} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="price">{t.kitchen.menu.price}</Label>
            <Input id="price" type="number" inputMode="numeric" min={1} value={f.price_pkr || ""} onChange={(e) => set({ price_pkr: Number(e.target.value) })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prep">{t.kitchen.menu.prep}</Label>
            <Input
              id="prep"
              type="number"
              inputMode="numeric"
              min={1}
              max={90}
              value={f.prep_min || ""}
              onChange={(e) => set({ prep_min: Number(e.target.value) })}
              aria-invalid={!fast}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="section">{t.kitchen.menu.section}</Label>
          <select
            id="section"
            value={f.section_id ?? ""}
            onChange={(e) => set({ section_id: e.target.value || null })}
            className="h-12 rounded-2xl border border-line bg-card px-3"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="">More</option>
          </select>
        </div>
        <label className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 font-semibold">
          {t.kitchen.menu.popular}
          <Switch checked={f.is_popular} onCheckedChange={(v) => set({ is_popular: v })} />
        </label>
        {item.id && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Camera /> {t.kitchen.menu.photo}
            </Button>
          </>
        )}
        <details className="rounded-2xl bg-muted p-3">
          <summary className="cursor-pointer font-semibold">{t.kitchen.menu.options}</summary>
          <Textarea className="mt-2 min-h-40 font-mono text-xs" value={f.options} onChange={(e) => set({ options: e.target.value })} />
        </details>
        <Button size="lg" onClick={save} disabled={busy || !f.name || !f.price_pkr}>
          {busy && <Loader2 className="animate-spin" />} {t.common.save}
        </Button>
        {item.id && (
          <Button variant="ghost" className="text-chili-deep" onClick={remove}>
            {t.common.delete}
          </Button>
        )}
      </div>
    </div>
  );
}
