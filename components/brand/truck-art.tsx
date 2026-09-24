import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Lahore truck-art motifs, used sparingly (empty states, the free
 * celebration). Chamak-patti triangles + rosettes in brand colours.
 */
export function TruckArtStrip({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={cn("h-3 w-full", className)} aria-hidden preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="36" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 12 L6 0 L12 12Z" fill="var(--wp-brand)" />
          <path d="M12 12 L18 0 L24 12Z" fill="var(--wp-mint)" />
          <path d="M24 12 L30 0 L36 12Z" fill="var(--wp-chili)" />
          <path d="M6 0 L12 12 L18 0Z" fill="var(--wp-gold)" opacity=".9" />
          <path d="M18 0 L24 12 L30 0Z" fill="#2f5bd3" opacity=".85" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function TruckArtPattern({ className, opacity = 0.18 }: { className?: string; opacity?: number }) {
  const id = useId();
  return (
    <svg className={cn("pointer-events-none absolute inset-0 size-full", className)} aria-hidden style={{ opacity }}>
      <defs>
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
          <g transform="translate(32 32)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <ellipse key={a} rx="4" ry="10" transform={`rotate(${a}) translate(0 -10)`} fill="var(--wp-brand)" />
            ))}
            <circle r="6" fill="var(--wp-gold)" />
            <circle r="2.5" fill="var(--wp-chili)" />
          </g>
          <circle cx="0" cy="0" r="3" fill="var(--wp-mint)" />
          <circle cx="64" cy="0" r="3" fill="var(--wp-mint)" />
          <circle cx="0" cy="64" r="3" fill="var(--wp-mint)" />
          <circle cx="64" cy="64" r="3" fill="var(--wp-mint)" />
          <path d="M0 32 l4 -4 l4 4 l-4 4z M56 32 l4 -4 l4 4 l-4 4z" fill="#2f5bd3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
