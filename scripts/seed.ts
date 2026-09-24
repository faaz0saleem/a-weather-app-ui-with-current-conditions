/**
 * Loads supabase/seed/data.ts into the Supabase project configured in .env.local.
 *
 *   npm run seed                  # upsert everything (safe to re-run)
 *   npm run seed -- --reset-orders   # also delete ALL orders (needs dev tools on)
 *
 * Creates test logins (phone + SEED_PASSWORD) for 1 admin, 3 customers,
 * 5 riders and 15 restaurant kitchens.
 */
import { createHash } from "node:crypto";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";
import { phoneToLoginEmail } from "../lib/auth/phone";
import {
  ADMIN,
  CLUSTERS,
  CUSTOMERS,
  RESTAURANTS,
  RIDERS,
  ZONE,
  restaurantStaffPhone,
} from "../supabase/seed/data";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD || "waqtpe123";
const domain = process.env.PHONE_LOGIN_DOMAIN || "phone.waqtpe.app";
const devTools = (process.env.SEED_DEV_TOOLS ?? "true") !== "false";
const resetOrders = process.argv.includes("--reset-orders");

if (!url || !key) {
  console.error("✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first (docs/SETUP-SUPABASE.md).");
  process.exit(1);
}

const sb = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/** Stable UUID from a name, so re-running the seed updates rows instead of duplicating them. */
function uuidFrom(name: string): string {
  const h = createHash("sha1").update(`waqtpe:${name}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Offset a [lat, lng] by metres north/east. */
function offset([lat, lng]: [number, number], [n, e]: [number, number]): [number, number] {
  return [lat + n / 111_195, lng + e / (111_195 * Math.cos((lat * Math.PI) / 180))];
}

function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser(phone: string, fullName: string): Promise<string> {
  const email = phoneToLoginEmail(phone, domain);
  const created = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  let id = created.data.user?.id ?? null;
  if (!id) {
    id = await findUserIdByEmail(email);
    if (!id) throw new Error(`Could not create or find user ${phone}: ${created.error?.message}`);
    await sb.auth.admin.updateUserById(id, { password, user_metadata: { full_name: fullName, phone } });
  }
  return id;
}

async function setProfile(
  id: string,
  p: { role: Database["public"]["Enums"]["user_role"]; full_name: string; phone: string; restaurant_id?: string | null },
) {
  must(
    await sb
      .from("profiles")
      .upsert({ id, is_test: true, restaurant_id: p.restaurant_id ?? null, role: p.role, full_name: p.full_name, phone: p.phone })
      .select("id"),
    `profile ${p.phone}`,
  );
}

async function main() {
  console.log(`→ Seeding ${url}`);

  // 1. Settings
  must(await sb.from("app_settings").update({ dev_tools_enabled: devTools }).eq("id", true).select("id"), "settings");
  console.log(`  ✓ settings (dev tools ${devTools ? "ON" : "OFF"})`);

  if (resetOrders) {
    const n = must(await sb.rpc("dev_delete_orders", { p_only_simulated: false }), "reset orders");
    console.log(`  ✓ deleted ${n} orders`);
  }

  // 2. Delivery zone
  must(
    await sb.from("zones").upsert({ id: uuidFrom("zone:dha-lahore"), name: ZONE.name, polygon: ZONE.polygon, is_active: true }).select("id"),
    "zone",
  );
  console.log("  ✓ delivery zone");

  // 3. Restaurants + menus
  for (const [i, r] of RESTAURANTS.entries()) {
    const restaurantId = uuidFrom(`restaurant:${r.slug}`);
    const [lat, lng] = offset(CLUSTERS[r.cluster].center, r.offsetM);
    must(
      await sb
        .from("restaurants")
        .upsert({
          id: restaurantId,
          slug: r.slug,
          name: r.name,
          tagline: r.tagline,
          cuisines: r.cuisines,
          cluster: CLUSTERS[r.cluster].name,
          address: `${CLUSTERS[r.cluster].name}, DHA Lahore`,
          phone: restaurantStaffPhone(i),
          lat,
          lng,
          rating: r.rating,
          rating_count: r.ratingCount,
          price_level: r.priceLevel,
          hero_emoji: r.emoji,
          hero_from: r.gradient[0],
          hero_to: r.gradient[1],
          opens_at: r.hours[0],
          closes_at: r.hours[1],
          is_active: true,
          sort: i,
        })
        .select("id"),
      `restaurant ${r.slug}`,
    );

    const keepItemIds: string[] = [];
    let sort = 0;
    for (const [si, section] of r.menu.entries()) {
      const sectionId = uuidFrom(`section:${r.slug}:${section.section}`);
      must(
        await sb.from("menu_sections").upsert({ id: sectionId, restaurant_id: restaurantId, name: section.section, sort: si }).select("id"),
        `section ${section.section}`,
      );
      const rows = section.items.map((it) => {
        const id = uuidFrom(`item:${r.slug}:${it.name}`);
        keepItemIds.push(id);
        return {
          id,
          restaurant_id: restaurantId,
          section_id: sectionId,
          name: it.name,
          description: it.desc ?? "",
          price_pkr: it.price,
          prep_min: it.prep,
          emoji: it.emoji ?? r.emoji,
          option_groups: it.options ?? [],
          is_popular: !!it.popular,
          is_available: true,
          is_active: true,
          sort: sort++,
        };
      });
      must(await sb.from("menu_items").upsert(rows).select("id"), `items for ${r.slug}`);
    }
    // Soft-delete seeded items that were removed from data.ts.
    await sb
      .from("menu_items")
      .update({ is_active: false })
      .eq("restaurant_id", restaurantId)
      .not("id", "in", `(${keepItemIds.join(",")})`);

    const staffId = await ensureUser(restaurantStaffPhone(i), r.staffName);
    await setProfile(staffId, { role: "restaurant", full_name: r.staffName, phone: restaurantStaffPhone(i), restaurant_id: restaurantId });
  }
  console.log(`  ✓ ${RESTAURANTS.length} restaurants, menus and kitchen logins`);

  // 4. Admin
  const adminId = await ensureUser(ADMIN.phone, ADMIN.name);
  await setProfile(adminId, { role: "admin", full_name: ADMIN.name, phone: ADMIN.phone });
  console.log("  ✓ admin");

  // 5. Customers + addresses
  for (const c of CUSTOMERS) {
    const id = await ensureUser(c.phone, c.name);
    await setProfile(id, { role: "customer", full_name: c.name, phone: c.phone });
    must(
      await sb
        .from("addresses")
        .upsert({ id: uuidFrom(`address:${c.phone}`), user_id: id, is_default: true, ...c.address })
        .select("id"),
      `address ${c.phone}`,
    );
  }
  console.log(`  ✓ ${CUSTOMERS.length} customers with DHA addresses`);

  // 6. Riders
  for (const r of RIDERS) {
    const id = await ensureUser(r.phone, r.name);
    await setProfile(id, { role: "rider", full_name: r.name, phone: r.phone });
    must(
      await sb
        .from("riders")
        .upsert({ id, vehicle: r.vehicle, plate: r.plate, is_test: true, is_active: true, last_lat: r.start[0], last_lng: r.start[1] })
        .select("id"),
      `rider ${r.phone}`,
    );
  }
  console.log(`  ✓ ${RIDERS.length} riders`);

  console.log(`\nTest logins (password: ${password})`);
  console.log(`  Admin       ${ADMIN.phone}`);
  CUSTOMERS.forEach((c) => console.log(`  Customer    ${c.phone}  ${c.name}`));
  RIDERS.forEach((r) => console.log(`  Rider       ${r.phone}  ${r.name}`));
  RESTAURANTS.forEach((r, i) => console.log(`  Restaurant  ${restaurantStaffPhone(i)}  ${r.name}`));
  console.log("\n✓ Seed complete.");
}

main().catch((e) => {
  console.error("✗ Seed failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
