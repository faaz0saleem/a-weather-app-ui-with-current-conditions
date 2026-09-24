import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, assertPublicEnv } from "./env";

/**
 * Per-request client acting as the signed-in user (RLS applies). Use it to
 * read the session and for user-scoped reads in Server Components.
 */
export async function getServerSupabase() {
  assertPublicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
