import { useId } from "react";
import { brand } from "@/config/brand";

const toVars = (c: Record<string, string>) => Object.entries(c).map(([k, v]) => `--wp-${k}:${v};`).join("");

export function BrandStyle() {
  const css = `:root{${toVars(brand.colors.light)}color-scheme:light;}.dark{${toVars(brand.colors.dark)}color-scheme:dark;}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/** Follows the visitor's system light/dark setting, before first paint. */
export function ThemeScript() {
  const js = `try{document.documentElement.classList.toggle("dark",matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="12" fill="var(--wp-ink)" />
      <circle cx="20" cy="21" r="11" fill="none" stroke="var(--wp-line)" strokeOpacity=".25" strokeWidth="4" />
      <circle cx="20" cy="21" r="11" fill="none" stroke="var(--wp-brand)" strokeWidth="4" strokeLinecap="round" strokeDasharray="51.8 69.1" transform="rotate(-90 20 21)" />
      <rect x="17.5" y="5" width="5" height="4" rx="1.5" fill="var(--wp-brand)" />
      <circle cx="20" cy="21" r="2.6" fill="var(--wp-cream)" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight">{brand.name}</span>
    </span>
  );
}

/** Lahore truck-art chamak-patti strip. */
export function TruckArtStrip({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg className={`h-3 w-full ${className}`} aria-hidden preserveAspectRatio="none">
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

export function TruckArtPattern({ opacity = 0.12 }: { opacity?: number }) {
  const id = useId();
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden style={{ opacity }}>
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
          <circle cx="64" cy="64" r="3" fill="var(--wp-mint)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
