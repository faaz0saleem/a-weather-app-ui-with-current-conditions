import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Light haptic tap where supported (Android Chrome). Silently no-ops elsewhere. */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    // Browsers only allow vibration after the user has interacted with the page.
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
