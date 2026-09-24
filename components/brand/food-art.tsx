import { cn } from "@/lib/utils";

/**
 * Tasteful placeholder until real photos arrive: warm gradient, soft light,
 * a big emoji. If an image URL exists, it wins.
 */
export function FoodArt({
  emoji,
  from,
  to,
  imageUrl,
  className,
  size = "md",
  alt = "",
}: {
  emoji: string;
  from: string;
  to: string;
  imageUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  alt?: string;
}) {
  const emojiSize = { sm: "text-3xl", md: "text-6xl", lg: "text-7xl", xl: "text-8xl" }[size];
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 90% at 20% 10%, ${from} 0%, ${to} 100%)` }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={alt} className="absolute inset-0 size-full object-cover" loading="lazy" />
      ) : (
        <>
          <div
            aria-hidden
            className="absolute -top-1/3 -right-1/4 size-[90%] rounded-full opacity-40 blur-2xl"
            style={{ background: from }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
              backgroundSize: "14px 14px",
            }}
          />
          <span
            {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
            className={cn("absolute inset-0 grid place-items-center drop-shadow-[0_10px_18px_rgba(0,0,0,.35)] select-none", emojiSize)}
          >
            {emoji}
          </span>
        </>
      )}
    </div>
  );
}
