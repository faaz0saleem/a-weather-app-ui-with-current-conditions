import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/** Mark: a countdown ring three-quarters full with a saffron dot — the promise, drawn. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="12" fill="var(--wp-ink)" />
      <circle cx="20" cy="21" r="11" fill="none" stroke="var(--wp-line)" strokeOpacity=".25" strokeWidth="4" />
      <circle
        cx="20"
        cy="21"
        r="11"
        fill="none"
        stroke="var(--wp-brand)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="51.8 69.1"
        transform="rotate(-90 20 21)"
      />
      <rect x="17.5" y="5" width="5" height="4" rx="1.5" fill="var(--wp-brand)" />
      <circle cx="20" cy="21" r="2.6" fill="var(--wp-cream)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight">{brand.name}</span>
    </span>
  );
}
