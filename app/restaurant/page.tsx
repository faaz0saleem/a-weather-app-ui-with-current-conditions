import Link from "next/link";
import { FoodArt } from "@/components/brand/food-art";
import { KitchenDashboard } from "@/components/kitchen/kitchen-dashboard";
import { getViewer } from "@/lib/server/auth";
import { getClock, getSettings } from "@/lib/server/dispatch";
import { listKitchenOrders, requireKitchen } from "@/lib/server/kitchen";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ searchParams }: PageProps<"/restaurant">) {
  const viewer = (await getViewer())!;
  const sp = await searchParams;
  const picked = typeof sp.r === "string" ? sp.r : null;

  // Admins pick which kitchen to open.
  if (viewer.role === "admin" && !picked) {
    const { data } = await getServiceSupabase().from("restaurants").select("id, name, hero_emoji, hero_from, hero_to, cluster").order("sort");
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-4 font-display text-3xl font-extrabold">Open a kitchen</h1>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(data ?? []).map((r) => (
            <li key={r.id}>
              <Link href={`/restaurant?r=${r.id}`} className="block overflow-hidden rounded-2xl bg-card shadow-soft">
                <FoodArt emoji={r.hero_emoji} from={r.hero_from} to={r.hero_to} size="sm" className="h-20" />
                <p className="px-3 pt-2 font-bold">{r.name}</p>
                <p className="px-3 pb-3 text-xs text-ink-soft">{r.cluster}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  const restaurant = await requireKitchen(viewer, picked);
  const s = await getSettings();
  const [orders, clock] = await Promise.all([listKitchenOrders(restaurant.id, s.fastLaneMaxPrepMin), getClock()]);
  return (
    <KitchenDashboard
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        emoji: restaurant.hero_emoji,
        pausedUntil: restaurant.paused_until,
        isAccepting: restaurant.is_accepting,
      }}
      asAdmin={viewer.role === "admin"}
      initialOrders={orders}
      serverNow={clock.now.getTime()}
    />
  );
}
