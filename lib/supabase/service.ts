import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL } from "./env";

let client: SupabaseClient<Database> | null = null;

/**
 * Service-role client. Bypasses RLS — server code only, and only after the
 * caller has been authenticated/authorised (lib/server/auth.ts).
 */
export function getServiceSupabase(): SupabaseClient<Database> {
  if (client) return client;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("Missing SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY). See docs/SETUP-SUPABASE.md.");
  }
  client = createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
