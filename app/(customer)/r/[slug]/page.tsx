import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/customer/auto-refresh";
import { RestaurantMenu } from "@/components/customer/restaurant-menu";
import { getViewer } from "@/lib/server/auth";
import { getRestaurantPage, resolveDeliveryPoint } from "@/lib/server/catalog";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/r/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getServiceSupabase().from("restaurants").select("name, tagline").eq("slug", slug).maybeSingle();
  return data ? { title: data.name, description: data.tagline } : {};
}

export default async function RestaurantPage({ params }: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const viewer = await getViewer();
  const { point } = await resolveDeliveryPoint(viewer?.id ?? null);
  const result = await getRestaurantPage(slug, point);
  if (!result) notFound();
  return (
    <>
      <AutoRefresh seconds={60} />
      <RestaurantMenu restaurant={result.page} fastLaneMax={result.settings.fastLaneMaxPrepMin} />
    </>
  );
}
