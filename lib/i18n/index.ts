import { en, type Strings } from "./en";

/**
 * The active strings. English/Roman Urdu for the pilot; when Urdu arrives,
 * pick the locale here (cookie or profile) and return `ur`.
 */
export const t: Strings = en;

/** Map a DB error ("WP:item_out_of_stock ...") to friendly copy. */
export function errorMessage(code: string | null | undefined): string {
  if (!code) return t.errors.generic;
  const key = code.replace(/^WP:/, "").split(/\s/)[0];
  return t.errors.WP[key] ?? t.errors.generic;
}

export type { Strings };
