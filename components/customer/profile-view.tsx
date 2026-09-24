"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ChevronRight, LifeBuoy, LogOut, MapPin, Monitor, Moon, Plus, Star, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { formatAddress } from "@/lib/address";
import { formatPkPhone } from "@/lib/auth/phone";
import { api } from "@/lib/client/api";
import { t } from "@/lib/i18n";
import type { AddressRow } from "@/lib/server/catalog";
import { cn } from "@/lib/utils";

export function ProfileView({
  name,
  phone,
  role,
  roleHome,
  addresses,
}: {
  name: string;
  phone: string | null;
  role: string;
  roleHome: string | null;
  addresses: AddressRow[];
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function signOut() {
    await api("/api/auth/logout", { json: {} }).catch(() => {});
    toast(t.auth.signedOut);
    router.replace("/");
    router.refresh();
  }

  async function makeDefault(id: string) {
    await api(`/api/addresses/${id}`, { method: "PATCH", json: { is_default: true } });
    router.refresh();
  }

  async function remove(id: string) {
    await api(`/api/addresses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div className="mb-6 flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-3xl bg-brand font-display text-2xl font-extrabold text-brand-ink">
          {name.slice(0, 1).toUpperCase() || "?"}
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold">{name || t.profile.title}</h1>
          <p className="tabular text-ink-soft">{formatPkPhone(phone)}</p>
          {role !== "customer" && <Badge variant="ink" className="mt-1 capitalize">{role}</Badge>}
        </div>
      </div>

      {roleHome && (
        <Button asChild variant="ink" className="mb-5 w-full">
          <Link href={roleHome}>Open {role} app</Link>
        </Button>
      )}

      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t.profile.addresses}</h2>
          <Link href="/addresses/new?next=/profile" className="flex items-center gap-1 text-sm font-bold text-brand">
            <Plus className="size-4" /> {t.profile.addAddress}
          </Link>
        </div>
        <ul className="space-y-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
              <MapPin className="size-5 shrink-0 text-brand" />
              <Link href={`/addresses/${a.id}`} className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-bold">
                  {a.label} {a.is_default && <Badge variant="soft">{t.profile.defaultBadge}</Badge>}
                </span>
                <span className="block truncate text-sm text-ink-soft">{formatAddress(a)}</span>
              </Link>
              {!a.is_default && (
                <button onClick={() => makeDefault(a.id)} aria-label={t.profile.makeDefault} className="grid size-9 place-items-center rounded-full hover:bg-muted">
                  <Star className="size-4" />
                </button>
              )}
              <button onClick={() => remove(a.id)} aria-label={t.common.delete} className="grid size-9 place-items-center rounded-full text-chili hover:bg-chili/10">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 font-display text-lg font-bold">{t.profile.appearance}</h2>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1">
          {(
            [
              ["light", t.profile.light, Sun],
              ["dark", t.profile.dark, Moon],
              ["system", t.profile.system, Monitor],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              aria-pressed={mounted && theme === value}
              className={cn(
                "flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold",
                mounted && theme === value ? "bg-card shadow-soft" : "text-ink-soft",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8 divide-y divide-line rounded-2xl bg-card shadow-soft">
        <a href={`tel:${brand.supportPhone.replace(/\s/g, "")}`} className="flex items-center gap-3 p-4 font-semibold">
          <LifeBuoy className="size-5 text-brand" /> <span className="flex-1">{t.profile.help}</span>
          <span className="text-sm text-ink-soft">{brand.supportPhone}</span>
          <ChevronRight className="size-4 text-ink-soft" />
        </a>
        <button onClick={signOut} className="flex w-full items-center gap-3 p-4 text-left font-semibold text-chili">
          <LogOut className="size-5" /> {t.common.signOut}
        </button>
      </section>
      <p className="pb-4 text-center text-xs text-ink-soft">
        {brand.name} · {brand.tagline}
      </p>
    </div>
  );
}
