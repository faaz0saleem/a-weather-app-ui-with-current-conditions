"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown, MapPin, Plus } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { formatAddress, shortAddress } from "@/lib/address";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type AddressOption = {
  id: string;
  label: string;
  phase: string;
  block: string;
  house_no: string;
  street: string | null;
};

export function setChosenAddress(id: string) {
  document.cookie = `wp_addr=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function AddressSwitcher({
  addresses,
  currentId,
  signedIn,
}: {
  addresses: AddressOption[];
  currentId: string | null;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const current = addresses.find((a) => a.id === currentId) ?? null;

  if (!signedIn || addresses.length === 0) {
    return (
      <Link
        href={signedIn ? "/addresses/new" : "/login?next=/addresses/new"}
        className="flex items-center gap-2 rounded-full bg-card py-1.5 pr-3 pl-2 text-sm font-semibold shadow-soft"
      >
        <span className="grid size-7 place-items-center rounded-full bg-brand text-brand-ink">
          <MapPin className="size-4" />
        </span>
        {t.home.setAddress}
      </Link>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex min-w-0 items-center gap-2 text-left">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">
          <MapPin className="size-4.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold tracking-wider text-ink-soft uppercase">{t.home.deliverTo}</span>
          <span className="flex items-center gap-1 truncate text-[15px] font-bold">
            {current ? `${current.label} · ${shortAddress(current)}` : t.home.setAddress}
            <ChevronDown className="size-4 shrink-0" />
          </span>
        </span>
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <div className="px-5 pb-8">
            <DrawerTitle className="mt-2">{t.checkout.deliverTo}</DrawerTitle>
            <DrawerDescription className="mb-4">{t.address.pinBody}</DrawerDescription>
            <ul className="space-y-2">
              {addresses.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => {
                      setChosenAddress(a.id);
                      setOpen(false);
                      router.refresh();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left",
                      a.id === currentId ? "border-brand bg-brand-soft/60" : "border-line bg-cream",
                    )}
                  >
                    <MapPin className="size-5 shrink-0 text-brand" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{a.label}</span>
                      <span className="block truncate text-sm text-ink-soft">{formatAddress(a)}</span>
                    </span>
                    {a.id === currentId && <Check className="size-5 text-brand" />}
                  </button>
                </li>
              ))}
            </ul>
            <Link
              href="/addresses/new"
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line p-3 font-semibold text-ink-soft hover:border-brand hover:text-ink"
            >
              <Plus className="size-4" /> {t.profile.addAddress}
            </Link>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
