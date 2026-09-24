import { z } from "zod";
import { json, readJson, route } from "@/lib/server/http";
import { signUpWithPhone } from "@/lib/server/phone-auth";

const body = z.object({
  fullName: z.string().min(1).max(60),
  phone: z.string().min(5).max(20),
  password: z.string().min(6).max(128),
});

export const POST = route(async (req: Request) => {
  const input = body.parse(await readJson(req));
  await signUpWithPhone(input);
  return json({ ok: true, redirect: "/" });
});
