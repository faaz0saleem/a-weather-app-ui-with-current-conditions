import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { RaceScreen } from "@/components/race/race-screen";
import { getViewer } from "@/lib/server/auth";
import { getCustomerOrder } from "@/lib/server/customer-orders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order" };

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/orders/${id}`);
  const order = await getCustomerOrder(viewer, id);
  if (!order) notFound();
  return <RaceScreen initial={order} justPlaced={sp.placed === "1"} />;
}
