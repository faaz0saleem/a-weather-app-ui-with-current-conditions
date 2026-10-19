import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/service";
import { homeFor } from "@/lib/server/auth";
import { json, readJson, route } from "@/lib/server/http";
import { signInWithPhone } from "@/lib/server/phone-auth";
import { LIMITS, clientIp, enforceLimit } from "@/lib/server/rate-limit";

const body = z.object({ phone: z.string().min(5).max(20), password: z.string().min(1).max(128) });

export const POST = route(async (req: Request) => {
  enforceLimit("login", clientIp(req), LIMITS.login);
  const { phone, password } = body.parse(await readJson(req));
  enforceLimit("login-phone", phone.replace(/\D/g, ""), LIMITS.loginPerPhone);
  const user = await signInWithPhone(phone, password);
  const { data: profile } = await getServiceSupabase().from("profiles").select("role").eq("id", user.id).single();
  return json({ ok: true, redirect: homeFor(profile?.role ?? "customer") });
});
