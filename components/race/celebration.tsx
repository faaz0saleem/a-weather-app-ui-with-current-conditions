"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Share2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { TruckArtPattern, TruckArtStrip } from "@/components/brand/truck-art";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/format";
import { t } from "@/lib/i18n";

/** Deterministic pseudo-random in [0, 1) — keeps render pure. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const COLORS = ["var(--wp-brand)", "var(--wp-mint)", "var(--wp-chili)", "#2f5bd3", "var(--wp-cream)"];

/** Full-screen gold "It's on us 🎉" + shareable card (next/og). */
export function Celebration({
  open,
  onClose,
  orderId,
  amountPkr,
  collectPkr,
  restaurantName,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amountPkr: number;
  collectPkr: number;
  restaurantName: string;
}) {
  const [sharing, setSharing] = useState(false);
  const confetti = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        x: rand(i, 1) * 100,
        delay: rand(i, 2) * 0.6,
        dur: 2.4 + rand(i, 3) * 1.8,
        rot: rand(i, 4) * 720 - 360,
        size: 6 + rand(i, 5) * 8,
        color: COLORS[i % COLORS.length],
        round: rand(i, 6) > 0.6,
      })),
    [],
  );
  const imageUrl = `/api/share/${orderId}`;
  const shareText = t.share.text(amountPkr, restaurantName);

  async function share() {
    setSharing(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "waqtpe-its-on-us.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText, title: t.share.title });
      } else if (navigator.share) {
        await navigator.share({ text: shareText, title: t.share.title, url: window.location.origin });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
      }
    } catch {
      /* user cancelled */
    } finally {
      setSharing(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t.race.freeFlip}
          className="light-scope fixed inset-0 z-[60] flex flex-col overflow-hidden bg-gold text-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <TruckArtPattern opacity={0.16} />
          <TruckArtStrip className="relative h-4" />
          {confetti.map((c) => (
            <motion.span
              key={c.id}
              aria-hidden
              className="absolute top-0"
              style={{ left: `${c.x}%`, width: c.size, height: c.size * (c.round ? 1 : 0.45), background: c.color, borderRadius: c.round ? 999 : 2 }}
              initial={{ y: -20, rotate: 0, opacity: 1 }}
              animate={{ y: "105vh", rotate: c.rot, opacity: [1, 1, 0.8] }}
              transition={{ duration: c.dur, delay: c.delay, ease: "easeIn" }}
            />
          ))}
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="absolute top-[max(env(safe-area-inset-top),1.25rem)] right-4 z-10 grid size-11 place-items-center rounded-full bg-ink/10"
          >
            <X className="size-5" />
          </button>
          <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
            <motion.div
              initial={{ scale: 0.3, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="mb-4 text-8xl drop-shadow-[0_12px_20px_rgba(0,0,0,.2)]"
            >
              🎉
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="font-display text-[54px] leading-[0.95] font-extrabold"
            >
              {t.race.freeFlipTitle}
            </motion.h2>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 text-lg font-semibold">
              {t.race.freeFlipBody(amountPkr)}
            </motion.p>
            {collectPkr > 0 && <p className="mt-1 text-sm font-semibold opacity-75">{t.race.freeAboveCap(collectPkr)}</p>}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="tabular mt-6 rounded-3xl bg-ink px-6 py-3 font-display text-3xl font-extrabold text-gold"
            >
              −{formatPKR(amountPkr)}
            </motion.div>
          </div>
          <div className="safe-bottom relative mx-auto w-full max-w-md space-y-2 px-5">
            <Button size="xl" variant="ink" className="w-full" onClick={share} disabled={sharing}>
              {sharing ? <Loader2 className="animate-spin" /> : <Share2 />} {t.race.freeShare}
            </Button>
            <div className="flex gap-2">
              <Button asChild variant="ghost" className="flex-1 hover:bg-ink/10">
                <a href={imageUrl} download="waqtpe-its-on-us.png">
                  <Download /> {t.share.download}
                </a>
              </Button>
              <Button variant="ghost" className="flex-1 hover:bg-ink/10" onClick={onClose}>
                {t.race.freeKeep}
              </Button>
            </div>
          </div>
          <TruckArtStrip className="relative mt-3 h-4 rotate-180" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
