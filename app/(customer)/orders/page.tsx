import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/customer/empty-state";
import { OrderHistory } from "@/components/customer/order-history";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { getViewer } from "@/lib/server/auth";
import { listCustomerOrders } from "@/lib/server/customer-orders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.orders.title };

export default async function OrdersPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/orders");
  const { orders, savedPkr, freeCount } = await listCustomerOrders(viewer.id);
  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <h1 className="mb-4 font-display text-3xl font-extrabold">{t.orders.title}</h1>
      {orders.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title={t.orders.empty}
          body={t.orders.emptyBody}
          action={
            <Button asChild>
              <Link href="/">{t.cart.browse}</Link>
            </Button>
          }
        />
      ) : (
        <OrderHistory orders={orders} savedPkr={savedPkr} freeCount={freeCount} />
      )}
    </div>
  );
}
