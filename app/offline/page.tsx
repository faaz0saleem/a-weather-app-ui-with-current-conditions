import { EmptyState } from "@/components/customer/empty-state";
import { t } from "@/lib/i18n";

export const metadata = { title: "Offline" };

/** Served by the service worker when there's no connection. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-5">
      <EmptyState emoji="📡" title="No internet" body={t.common.offline} className="w-full" />
    </main>
  );
}
