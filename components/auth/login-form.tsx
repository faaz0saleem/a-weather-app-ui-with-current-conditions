"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Logo } from "@/components/brand/logo";
import { TruckArtPattern, TruckArtStrip } from "@/components/brand/truck-art";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizePkPhone } from "@/lib/auth/phone";
import { api } from "@/lib/client/api";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LoginForm({ next }: { next: string | null }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalizePkPhone(phone)) return setError(t.auth.invalidPhone);
    if (password.length < 6) return setError(t.auth.shortPassword);
    if (mode === "up" && !name.trim()) return setError(t.auth.nameRequired);
    setBusy(true);
    try {
      const r =
        mode === "in"
          ? await api<{ redirect: string }>("/api/auth/login", { json: { phone, password } })
          : await api<{ redirect: string }>("/api/auth/signup", { json: { phone, password, fullName: name } });
      window.location.assign(next && (r.redirect === "/" || mode === "up") ? next : r.redirect);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-cream">
      <div className="relative overflow-hidden bg-ink px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-10 text-cream">
        <TruckArtPattern opacity={0.1} />
        <Logo className="relative text-cream" />
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-10 font-display text-[40px] leading-[1.02] font-extrabold"
        >
          {t.auth.welcomeTitle}
        </motion.h1>
        <p className="relative mt-2 text-cream/75">{t.auth.welcomeBody}</p>
      </div>
      <TruckArtStrip />

      <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-6 pt-6 pb-8" noValidate>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist">
          {(["in", "up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={cn("h-10 rounded-xl text-sm font-bold transition-all", mode === m ? "bg-card shadow-soft" : "text-ink-soft")}
            >
              {m === "in" ? t.auth.signIn : t.auth.signUp}
            </button>
          ))}
        </div>

        {mode === "up" && (
          <div className="grid gap-1.5">
            <Label htmlFor="name">{t.auth.nameLabel}</Label>
            <Input id="name" autoComplete="name" placeholder={t.auth.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="phone">{t.auth.phoneLabel}</Label>
          <div className="flex items-center gap-2">
            <span className="grid h-12 place-items-center rounded-2xl border border-line bg-card px-3 font-semibold text-ink-soft">🇵🇰 +92</span>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t.auth.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!error && !normalizePkPhone(phone)}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="password">{t.auth.passwordLabel}</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            placeholder={t.auth.passwordHint}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "up" && <p className="text-xs text-ink-soft">{t.auth.otpSoon}</p>}
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-chili/10 px-4 py-3 text-sm font-semibold text-chili-deep">
            {error}
          </p>
        )}

        <div className="mt-auto pt-4">
          <Button type="submit" size="xl" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "in" ? t.auth.signIn : t.auth.signUp}
          </Button>
        </div>
      </form>
    </main>
  );
}
