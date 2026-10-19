"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";

export function PageHeader({ title, back = true, right }: { title: string; back?: boolean | string; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 bg-cream/90 px-3 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 backdrop-blur-md">
      {back && (
        <button
          onClick={() => (typeof back === "string" ? router.push(back) : window.history.length > 1 ? router.back() : router.push("/"))}
          aria-label={t.common.back}
          className="grid size-11 place-items-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
      )}
      <h1 className="flex-1 truncate font-display text-xl font-bold">{title}</h1>
      {right}
    </header>
  );
}
