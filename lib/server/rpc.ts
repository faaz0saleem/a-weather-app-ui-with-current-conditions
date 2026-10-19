import "server-only";

import { getServiceSupabase } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/supabase/database.types";
import { dbError } from "./http";

type Status = Database["public"]["Enums"]["order_status"];
export type Actor = { id: string | null; role: "customer" | "restaurant" | "rider" | "admin" | "system" };
export const SYSTEM: Actor = { id: null, role: "system" };

/** The ONLY way the app changes an order's status (the DB enforces the machine). */
export async function transition(orderId: string, to: Status, actor: Actor, patch: Record<string, unknown> = {}, meta: Record<string, unknown> = {}) {
  const { data, error } = await getServiceSupabase().rpc("transition_order", {
    p_order_id: orderId,
    p_to: to,
    p_actor_id: actor.id as string,
    p_actor_role: actor.role,
    p_patch: patch as Json,
    p_meta: meta as Json,
  });
  return { data, error };
}

export async function transitionOrThrow(...args: Parameters<typeof transition>) {
  const { data, error } = await transition(...args);
  if (error) throw dbError(error);
  return data!;
}

export async function assignRider(orderId: string, riderId: string | null, actor: Actor, payoutPkr: number) {
  const { data, error } = await getServiceSupabase().rpc("assign_rider", {
    p_order_id: orderId,
    p_rider_id: riderId as string,
    p_actor_id: actor.id as string,
    p_actor_role: actor.role,
    p_payout_pkr: payoutPkr,
  });
  return { data, error };
}
