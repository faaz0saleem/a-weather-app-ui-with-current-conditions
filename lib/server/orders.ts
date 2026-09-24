import "server-only";

import { z } from "zod";
import { formatAddress } from "@/lib/address";
import { priceCart, type PricedCart } from "@/lib/guarantee/pricing";
import { t } from "@/lib/i18n";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/database.types";
import type { Viewer } from "./auth";
import { toQuoteView, type QuoteView } from "./catalog";
import { loadDispatchContext, quote } from "./dispatch";
import { ApiError, badRequest, dbError, notFound } from "./http";

export const cartLineSchema = z.object({
  itemId: z.string().uuid(),
  qty: z.number().int().min(1).max(20),
  options: z.record(z.string(), z.array(z.string()).max(20)).default({}),
});

export const quoteInputSchema = z.object({
  restaurantId: z.string().uuid(),
  addressId: z.string().uuid().nullable().optional(),
  lines: z.array(cartLineSchema).max(50).default([]),
});

export const placeOrderSchema = quoteInputSchema.extend({
  addressId: z.string().uuid(),
  lines: z.array(cartLineSchema).min(1).max(50),
  note: z.string().max(300).optional(),
  /** What the customer saw at checkout. If they expected the timer and it's gone (Rain Mode), stop. */
  expectGuarantee: z.boolean(),
});

export type CheckoutQuote = {
  quote: QuoteView;
  pricing: Extract<PricedCart, { ok: true }> | null;
  pricingError: string | null;
  freeCapPkr: number;
  rainMode: boolean;
};

const PRICING_COPY: Record<string, string> = {
  empty_cart: t.cart.empty,
  item_unavailable: t.errors.WP.item_unavailable,
  item_out_of_stock: t.errors.WP.item_out_of_stock,
  item_not_fast_lane: t.errors.WP.item_not_fast_lane,
  mixed_restaurants: t.errors.generic,
  bad_quantity: t.errors.generic,
  bad_options: t.errors.generic,
};

async function loadAddress(viewer: Viewer, addressId: string) {
  const { data } = await getServiceSupabase().from("addresses").select("*").eq("id", addressId).maybeSingle();
  if (!data || (data.user_id !== viewer.id && viewer.role !== "admin")) throw notFound("Address not found");
  return data;
}

async function loadRestaurantAndMenu(restaurantId: string) {
  const sb = getServiceSupabase();
  const [r, items] = await Promise.all([
    sb.from("restaurants").select("*").eq("id", restaurantId).maybeSingle(),
    sb.from("menu_items").select("*").eq("restaurant_id", restaurantId),
  ]);
  if (!r.data) throw notFound("Restaurant not found");
  return { restaurant: r.data, menu: items.data ?? [] };
}

/** Price the cart + run the eligibility check against DB time. Used by checkout. */
export async function quoteCheckout(
  viewer: Viewer | null,
  input: z.infer<typeof quoteInputSchema>,
): Promise<CheckoutQuote> {
  const [{ restaurant, menu }, ctx] = await Promise.all([loadRestaurantAndMenu(input.restaurantId), loadDispatchContext()]);
  const pricing = input.lines.length ? priceCart(restaurant.id, input.lines, menu, ctx.settings) : null;

  let point: { lat: number; lng: number } | null = null;
  if (input.addressId && viewer) {
    const a = await loadAddress(viewer, input.addressId);
    point = { lat: a.lat, lng: a.lng };
  }
  const prep = pricing?.ok ? pricing.maxPrepMin : ctx.settings.fastLaneMaxPrepMin;
  const q = point
    ? toQuoteView(quote(ctx, restaurant, point, prep), restaurant.name)
    : ({ ok: false, code: "no_address", message: t.checkout.addAddress, retryInMin: null } as const);

  return {
    quote: q,
    pricing: pricing?.ok ? pricing : null,
    pricingError: pricing && !pricing.ok ? (PRICING_COPY[pricing.code] ?? t.errors.generic) : null,
    freeCapPkr: ctx.settings.freeCapPkr,
    rainMode: ctx.settings.rainMode,
  };
}

/**
 * Place an order: price on the server, check eligibility on DB time, then let
 * the database start the clock (create_order). Nothing is taken on trust from
 * the device.
 */
export async function placeOrder(
  viewer: Viewer,
  input: z.infer<typeof placeOrderSchema>,
  opts: { simulated?: boolean } = {},
) {
  const [address, { restaurant, menu }, ctx] = await Promise.all([
    loadAddress(viewer, input.addressId),
    loadRestaurantAndMenu(input.restaurantId),
    loadDispatchContext(),
  ]);

  const pricing = priceCart(restaurant.id, input.lines, menu, ctx.settings);
  if (!pricing.ok) throw new ApiError(409, pricing.code, PRICING_COPY[pricing.code] ?? t.errors.generic, { itemId: pricing.itemId });

  const drop = { lat: address.lat, lng: address.lng };
  const result = quote(ctx, restaurant, drop, pricing.maxPrepMin);
  if (!result.ok) {
    const view = toQuoteView(result, restaurant.name);
    throw new ApiError(409, result.code, view.ok ? t.errors.generic : view.message, { retryInMin: result.retryInMin });
  }
  if (input.expectGuarantee && result.guarantee !== "active") {
    throw new ApiError(409, "guarantee_changed", t.errors.WP.rain_mode_no_guarantee);
  }

  const { data: profile } = await getServiceSupabase().from("profiles").select("full_name, phone").eq("id", viewer.id).single();

  const payload = {
    customer_id: viewer.id,
    restaurant_id: restaurant.id,
    address_id: address.id,
    drop_lat: drop.lat,
    drop_lng: drop.lng,
    drop_address: formatAddress(address),
    drop_gate_note: address.gate_note ?? null,
    customer_name: profile?.full_name ?? viewer.fullName,
    customer_phone: profile?.phone ?? viewer.phone,
    customer_note: input.note?.trim() || null,
    items: pricing.lines,
    items_subtotal_pkr: pricing.subtotalPkr,
    delivery_fee_pkr: pricing.deliveryFeePkr,
    payment_method: "cod",
    guarantee_active: result.guarantee === "active",
    predicted_eta_min: result.eta.totalMin,
    predicted_prep_min: Math.round(result.prepMin),
    predicted_rider_min: Number(result.rider.toRestaurantMin.toFixed(2)),
    predicted_ride_min: Number(result.eta.rideMin.toFixed(2)),
    planned_delivery_min: Number((result.eta.rideMin + result.eta.handoffMin).toFixed(2)),
    distance_km: Number(result.eta.distanceKm.toFixed(2)),
    is_simulated: !!opts.simulated,
  };

  const { data, error } = await getServiceSupabase().rpc("create_order", { p: payload as unknown as Json });
  if (error) throw dbError(error);
  if (!data) throw badRequest("order_failed");
  return data;
}
