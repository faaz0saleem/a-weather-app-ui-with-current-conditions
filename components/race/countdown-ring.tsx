"use client";

import { motion } from "motion/react";
import { formatClock } from "@/lib/format";
import { TONE_VAR, type TimerTone } from "@/lib/timer";
import { cn } from "@/lib/utils";

/** Fixed-width digits so the timer never jitters as numbers change. */
export function ClockDigits({ seconds, className }: { seconds: number; className?: string }) {
  const text = formatClock(seconds);
  return (
    <span className={cn("tabular inline-flex font-display font-extrabold", className)} aria-hidden>
      {text.split("").map((ch, i) =>
        ch === ":" ? (
          <span key={i} className="-mx-[0.02em] w-[0.3em] text-center opacity-70">
            :
          </span>
        ) : (
          <span key={i} className="w-[0.6em] text-center">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const SIZE = 280;
const STROKE = 18;
const R = (SIZE - STROKE) / 2 - 10;
const C = 2 * Math.PI * R;

/**
 * The race ring: mint → amber (≤10 min) → chili (≤3 min) → gold (free).
 * `progress` is the fraction of the window remaining (1 → 0).
 */
export function CountdownRing({
  progress,
  tone,
  children,
  ariaLabel,
}: {
  progress: number;
  tone: TimerTone;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const color = TONE_VAR[tone];
  const ticks = Array.from({ length: 30 }, (_, i) => i);
  return (
    <div role="timer" aria-label={ariaLabel} className="relative mx-auto aspect-square w-full max-w-[280px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90">
        {/* minute ticks */}
        {ticks.map((i) => {
          const a = (i / 30) * 2 * Math.PI;
          const outer = SIZE / 2 - 2;
          const inner = outer - (i % 5 === 0 ? 7 : 4);
          return (
            <line
              key={i}
              x1={round2(SIZE / 2 + inner * Math.cos(a))}
              y1={round2(SIZE / 2 + inner * Math.sin(a))}
              x2={round2(SIZE / 2 + outer * Math.cos(a))}
              y2={round2(SIZE / 2 + outer * Math.sin(a))}
              stroke="var(--wp-line)"
              strokeWidth={i % 5 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--wp-muted)" strokeWidth={STROKE} />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          initial={false}
          animate={{ strokeDashoffset: C * (1 - p), stroke: color }}
          transition={{ strokeDashoffset: { duration: 0.3, ease: "linear" }, stroke: { duration: 0.6 } }}
          style={{ filter: `drop-shadow(0 0 10px color-mix(in oklab, ${color} 45%, transparent))` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center text-center">{children}</div>
      </div>
    </div>
  );
}
