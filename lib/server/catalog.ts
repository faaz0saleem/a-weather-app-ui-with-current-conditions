import "server-only";

import { cookies } from "next/headers";
import { DHA_DEFAULT_CENTER } from "@/config/dha";
import type { EligibilityResult, GuaranteeSettings } from "@/lib/guarantee";
import { parseOptionGroups, type OptionGroup } from "@/lib/guarantee/pricing";
import { t } from "@/lib/i18n";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { Tables } from "@/lib/supabase/database.types";
import { loadDispatchContext, quote, typicalPrepMin, type DispatchContext } from "./dispatch";

export type AddressRow = Tables<"addresses">;

/** What the UI needs to show about "can I order from here, and how fast?" */
export type QuoteView =
  | { ok: true; guarantee: "active" | "off"; etaMin: number }
  | { ok: false; code: string; message: string; retryInMin: number | null };

export function toQuoteView(r: EligibilityResult, restaurantName: string): QuoteView {
  if (r.ok) return { ok: true, guarantee: r.guarantee, etaMin: r.etaMin };
  const e = t.eligibility;
  let message: string;
  switch (r.code) {
    case "too_far":
      message = e.too_far(restaurantName, r.detail.distanceKm, r.detail.radiusKm);
      break;
    case "eta_too_long":
      message = e.eta_too_long(r.detail.etaMin);
      break;
    case "closed":
    case "paused":
    case "no_rider":
    case "kitchen_busy":
    case "riders_busy":
      message = e[r.code](r.retryInMin);
      break;
    default:
      message = e[r.code]();
  }
  return { ok: false, code: r.code, message, retryInMin: r.retryInMin };
}

export type MenuItemView = {
  id: string;
  sectionId: string | null;
  name: string;
  description: string;
  pricePkr: number;
  prepMin: number;
  emoji: string;
  imageUrl: string | null;
  optionGroups: OptionGroup[];
  isAvailable: boolean;
  isPopular: boolean;
};

export type RestaurantCardView = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  cuisines: string[];
  cluster: string;
  rating: number;
  ratingCount: number;
  heroEmoji: string;
  heroFrom: string;
  heroTo: string;
  heroImageUrl: string | null;
  typicalPrepMin: number;
  quote: QuoteView;
};

/** The customer's delivery point: chosen address (cookie), else default, else DHA centre. */
export async function resolveDeliveryPoint(userId: string | null): Promise<{
  address: AddressRow | null;
  addresses: AddressRow[];
  point: { lat: number; lng: number };
}> {
  let addresses: AddressRow[] = [];
  if (userId) {
    const { data } = await getServiceSupabase()
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    addresses = data ?? [];
  }
  const chosenId = (await cookies()).get("wp_addr")?.value;
  const address = addresses.find((a) => a.id === chosenId) ?? addresses[0] ?? null;
  return {
    address,
    addresses,
    point: address ? { lat: address.lat, lng: address.lng } : { lat: DHA_DEFAULT_CENTER[0], lng: DHA_DEFAULT_CENTER[1] },
  };
}

/** All listed restaurants with a live quote to `point`, fastest first. */
export async function listRestaurantsWithQuotes(point: { lat: number; lng: number }): Promise<{
  restaurants: RestaurantCardView[];
  ctx: DispatchContext;
}> {
  const sb = getServiceSupabase();
  const [ctx, restRes, itemsRes] = await Promise.all([
    loadDispatchContext(),
    sb.from("restaurants").select("*").eq("is_active", true).order("sort"),
    sb.from("menu_items").select("restaurant_id, prep_min").eq("is_active", true),
  ]);
  const preps = new Map<string, number[]>();
  for (const i of itemsRes.data ?? []) preps.set(i.restaurant_id, [...(preps.get(i.restaurant_id) ?? []), i.prep_min]);

  const restaurants = (restRes.data ?? []).map((r) => {
    const prep = typicalPrepMin(preps.get(r.id) ?? [], ctx.settings);
    return {
      ...cardFromRow(r, prep),
      quote: toQuoteView(quote(ctx, r, point, prep), r.name),
    };
  });

  restaurants.sort((a, b) => {
    if (a.quote.ok !== b.quote.ok) return a.quote.ok ? -1 : 1;
    if (a.quote.ok && b.quote.ok) return a.quote.etaMin - b.quote.etaMin;
    return 0;
  });
  return { restaurants, ctx };
}

function cardFromRow(r: Tables<"restaurants">, prep: number): Omit<RestaurantCardView, "quote"> {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    cuisines: r.cuisines,
    cluster: r.cluster,
    rating: Number(r.rating),
    ratingCount: r.rating_count,
    heroEmoji: r.hero_emoji,
    heroFrom: r.hero_from,
    heroTo: r.hero_to,
    heroImageUrl: r.hero_image_url,
    typicalPrepMin: prep,
  };
}

export type RestaurantPageView = RestaurantCardView & {
  sections: { id: string; name: string; items: MenuItemView[] }[];
};

/** Restaurant + its sellable (fast-lane, active) menu. */
export async function getRestaurantPage(
  slug: string,
  point: { lat: number; lng: number },
): Promise<{ page: RestaurantPageView; settings: GuaranteeSettings } | null> {
  const sb = getServiceSupabase();
  const { data: r } = await sb.from("restaurants").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!r) return null;
  const [ctx, sectionsRes, itemsRes] = await Promise.all([
    loadDispatchContext(),
    sb.from("menu_sections").select("*").eq("restaurant_id", r.id).order("sort"),
    sb.from("menu_items").select("*").eq("restaurant_id", r.id).eq("is_active", true).order("sort"),
  ]);
  const s = ctx.settings;
  // Rule 8: only fast-lane items are sold, so only they are shown.
  const items = (itemsRes.data ?? []).filter((i) => i.prep_min <= s.fastLaneMaxPrepMin).map(itemView);
  const prep = typicalPrepMin(items.map((i) => i.prepMin), s);

  const sections = (sectionsRes.data ?? [])
    .map((sec) => ({ id: sec.id, name: sec.name, items: items.filter((i) => i.sectionId === sec.id) }))
    .filter((sec) => sec.items.length > 0);
  const orphans = items.filter((i) => !i.sectionId || !sections.some((sec) => sec.id === i.sectionId));
  if (orphans.length) sections.push({ id: "more", name: "More", items: orphans });

  return {
    page: { ...cardFromRow(r, prep), quote: toQuoteView(quote(ctx, r, point, prep), r.name), sections },
    settings: s,
  };
}

export function itemView(i: Tables<"menu_items">): MenuItemView {
  return {
    id: i.id,
    sectionId: i.section_id,
    name: i.name,
    description: i.description,
    pricePkr: i.price_pkr,
    prepMin: i.prep_min,
    emoji: i.emoji,
    imageUrl: i.image_url,
    optionGroups: parseOptionGroups(i.option_groups),
    isAvailable: i.is_available,
    isPopular: i.is_popular,
  };
}

export async function getOnTimeScore(): Promise<{ deliveries: number; avgMin: number | null; onTimePct: number | null; minRequired: number }> {
  const { data } = await getServiceSupabase().rpc("public_on_time_score");
  const d = (data ?? {}) as { deliveries?: number; avg_min?: number | null; on_time_pct?: number | null; min_required?: number };
  return {
    deliveries: Number(d.deliveries ?? 0),
    avgMin: d.avg_min == null ? null : Number(d.avg_min),
    onTimePct: d.on_time_pct == null ? null : Number(d.on_time_pct),
    minRequired: Number(d.min_required ?? 50),
  };
}

export { formatAddress } from "@/lib/address";
