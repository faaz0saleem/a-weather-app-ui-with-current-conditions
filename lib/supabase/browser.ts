"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

let client: SupabaseClient<Database> | null = null;

/** Browser client: reads through RLS, subscribes to Realtime. Never writes orders. */
export function getBrowserSupabase(): SupabaseClient<Database> {
  if (!client) client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}
