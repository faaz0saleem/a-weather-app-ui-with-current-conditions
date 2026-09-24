"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { t } from "@/lib/i18n";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** A calm banner when the device loses connection (realtime + polls resume on their own). */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-ink px-4 py-2 pt-[max(env(safe-area-inset-top),0.5rem)] text-sm font-semibold text-cream">
      <WifiOff className="size-4" /> {t.common.offline}
    </div>
  );
}
