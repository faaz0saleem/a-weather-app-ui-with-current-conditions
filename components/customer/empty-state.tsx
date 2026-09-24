import { TruckArtPattern, TruckArtStrip } from "@/components/brand/truck-art";
import { cn } from "@/lib/utils";

/** Friendly empty state with a touch of truck art. */
export function EmptyState({
  emoji,
  title,
  body,
  action,
  className,
}: {
  emoji: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-card text-center shadow-soft", className)}>
      <TruckArtStrip />
      <div className="relative px-6 py-8">
        <TruckArtPattern opacity={0.07} />
        <div className="relative mx-auto mb-3 grid size-20 place-items-center rounded-full bg-brand-soft text-4xl">{emoji}</div>
        <h3 className="relative font-display text-xl font-bold">{title}</h3>
        {body && <p className="relative mx-auto mt-1 max-w-xs text-sm text-ink-soft">{body}</p>}
        {action && <div className="relative mt-5 flex justify-center">{action}</div>}
      </div>
      <TruckArtStrip className="rotate-180" />
    </div>
  );
}
