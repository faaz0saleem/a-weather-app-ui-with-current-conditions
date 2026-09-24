import "server-only";

import { cache } from "react";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/database.types";
import { forbidden, unauthorized } from "./http";

export type Role = Database["public"]["Enums"]["user_role"];

export type Viewer = {
  id: string;
  role: Role;
  fullName: string;
  phone: string | null;
  restaurantId: string | null;
  avatarUrl: string | null;
};

/** The signed-in user + their profile, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await getServiceSupabase()
    .from("profiles")
    .select("id, role, full_name, phone, restaurant_id, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: profile.id,
    role: profile.role,
    fullName: profile.full_name,
    phone: profile.phone,
    restaurantId: profile.restaurant_id,
    avatarUrl: profile.avatar_url,
  };
});

/** For API routes: 401 if signed out, 403 if the role isn't allowed. Admin passes every role check. */
export async function requireViewer(roles?: Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw unauthorized();
  if (roles && !roles.includes(viewer.role) && viewer.role !== "admin") throw forbidden();
  return viewer;
}

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  switch (role) {
    case "restaurant":
      return "/restaurant";
    case "rider":
      return "/rider";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}
