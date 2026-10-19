"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, ChefHat, Shield, User, Wrench, Radio } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { formatPkPhone } from "@/lib/auth/phone";
import { api } from "@/lib/client/api";
import { t } from "@/lib/i18n";

type Account = { id: string; role: "customer" | "restaurant" | "rider" | "admin"; full_name: string; phone: string };

const ICON = { customer: User, restaurant: ChefHat, rider: Bike, admin: Shield } as const;
const ORDER = ["customer", "restaurant", "rider", "admin"] as const;

/** Dev-only: switch between seeded test accounts (D4). */
export function DevSwitcher() {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open || accounts) return;
    api<{ accounts: Account[] }>("/api/dev/accounts")
      .then((r) => setAccounts(r.accounts))
      .catch(() => setAccounts([]));
  }, [open, accounts]);

  async function switchTo(a: Account) {
    setBusy(a.id);
    try {
      const r = await api<{ redirect: string }>("/api/dev/switch", { json: { phone: a.phone } });
      toast.success(t.dev.signedInAs(a.full_name));
      setOpen(false);
      window.location.assign(r.redirect);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function ridersOnline() {
    setBusy("riders");
    try {
      const r = await api<{ count: number }>("/api/dev/riders-online", { json: {} });
      toast.success(`${r.count} test riders online`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-3 z-40 flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-2 text-xs font-bold text-cream shadow-lift backdrop-blur md:bottom-4"
        aria-label={t.dev.title}
      >
        <Wrench className="size-3.5" /> {t.dev.button}
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <div className="overflow-y-auto px-5 pb-8">
            <DrawerTitle className="mt-2">{t.dev.title}</DrawerTitle>
            <DrawerDescription className="mb-4">{t.dev.body}</DrawerDescription>
            <Button variant="soft" size="sm" className="mb-4" onClick={ridersOnline} disabled={busy === "riders"}>
              <Radio /> {t.dev.ridersOnline}
            </Button>
            {!accounts && <p className="text-sm text-ink-soft">{t.common.loading}</p>}
            {accounts?.length === 0 && <p className="text-sm text-ink-soft">No test accounts — run npm run seed.</p>}
            {ORDER.map((role) => {
              const list = accounts?.filter((a) => a.role === role) ?? [];
              if (!list.length) return null;
              const Icon = ICON[role];
              return (
                <section key={role} className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-ink-soft uppercase">
                    <Icon className="size-4" /> {role}
                  </h3>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {list.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => switchTo(a)}
                        disabled={!!busy}
                        className="flex items-center justify-between rounded-xl border border-line bg-cream px-3 py-2.5 text-left text-sm hover:border-brand disabled:opacity-50"
                      >
                        <span className="font-semibold">{a.full_name}</span>
                        <span className="tabular text-xs text-ink-soft">{busy === a.id ? "…" : formatPkPhone(a.phone)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
