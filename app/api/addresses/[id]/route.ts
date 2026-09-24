import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/service";
import { addressSchema } from "@/lib/server/addresses";
import { requireViewer } from "@/lib/server/auth";
import { dbError, json, notFound, readJson, route } from "@/lib/server/http";

async function own(userId: string, id: string) {
  const { data } = await getServiceSupabase().from("addresses").select("id, user_id").eq("id", id).maybeSingle();
  if (!data || data.user_id !== userId) throw notFound("Address not found");
}

export const PATCH = route(async (req: Request, ctx: RouteContext<"/api/addresses/[id]">) => {
  const viewer = await requireViewer();
  const { id } = await ctx.params;
  await own(viewer.id, id);
  const input = addressSchema.partial().parse(await readJson(req));
  const sb = getServiceSupabase();
  if (input.is_default) await sb.from("addresses").update({ is_default: false }).eq("user_id", viewer.id);
  const { data, error } = await sb.from("addresses").update(input).eq("id", id).select("*").single();
  if (error) throw dbError(error);
  return json({ address: data });
});

export const DELETE = route(async (_req: Request, ctx: RouteContext<"/api/addresses/[id]">) => {
  const viewer = await requireViewer();
  const { id } = await ctx.params;
  await own(viewer.id, id);
  const { error } = await getServiceSupabase().from("addresses").delete().eq("id", id);
  if (error) throw dbError(error);
  const jar = await cookies();
  if (jar.get("wp_addr")?.value === id) jar.delete("wp_addr");
  return json({ ok: true });
});
