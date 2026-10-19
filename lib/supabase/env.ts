/**
 * Supabase connection settings. Supports both the new key names
 * (publishable / secret) and the legacy ones (anon / service_role).
 * NEXT_PUBLIC_* values are baked in at build time — set them in Hostinger
 * BEFORE you build.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function assertPublicEnv() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see docs/SETUP-SUPABASE.md).",
    );
  }
}

/** Dev tools (role switcher, simulation, time warp). Must be off in production. */
export const DEV_TOOLS = process.env.NEXT_PUBLIC_DEV_TOOLS === "true";
