/**
 * Race-screen colour phases (UI only — the guarantee decision itself is made
 * on the server). mint > 10 min → amber ≤ 10 → chili ≤ 3 → gold once free.
 */
export type TimerTone = "mint" | "amber" | "chili" | "gold" | "muted";

export const AMBER_BELOW_SEC = 10 * 60;
export const CHILI_BELOW_SEC = 3 * 60;

export function timerTone(remainingSec: number | null, guaranteeState?: string | null): TimerTone {
  if (guaranteeState === "free") return "gold";
  if (remainingSec === null || guaranteeState === "off" || guaranteeState === "void") return "muted";
  if (remainingSec <= 0) return "gold";
  if (remainingSec <= CHILI_BELOW_SEC) return "chili";
  if (remainingSec <= AMBER_BELOW_SEC) return "amber";
  return "mint";
}

export const TONE_BG: Record<TimerTone, string> = {
  mint: "bg-mint",
  amber: "bg-amber",
  chili: "bg-chili text-white",
  gold: "bg-gold",
  muted: "bg-muted",
};

export const TONE_TEXT: Record<TimerTone, string> = {
  mint: "text-mint",
  amber: "text-amber",
  chili: "text-chili",
  gold: "text-gold",
  muted: "text-ink-soft",
};

export const TONE_VAR: Record<TimerTone, string> = {
  mint: "var(--wp-mint)",
  amber: "var(--wp-amber)",
  chili: "var(--wp-chili)",
  gold: "var(--wp-gold)",
  muted: "var(--wp-line)",
};
