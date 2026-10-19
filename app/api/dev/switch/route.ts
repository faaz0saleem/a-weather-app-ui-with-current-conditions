import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { homeFor } from "@/lib/server/auth";
import { requireDevTools } from "@/lib/server/dev";
import { json, readJson, route } from "@/lib/server/http";
import { signInWithPhone } from "@/lib/server/phone-auth";

const body = z.object({ phone: z.string() });

/** Dev role switcher: sign in as a seeded test account. The password never leaves the server. */
export const POST = route(async (req: Request) => {
  requireDevTools();
  const { phone } = body.parse(await readJson(req));
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  const user = await signInWithPhone(phone, process.env.SEED_PASSWORD || "waqtpe123");
  const { data: profile } = await getServiceSupabase().from("profiles").select("role").eq("id", user.id).single();
  return json({ ok: true, redirect: homeFor(profile?.role ?? "customer") });
});
