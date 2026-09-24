"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/customer/empty-state";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-5">
      <EmptyState
        emoji="😵‍💫"
        title={t.common.somethingWrong}
        body={error.digest ? `Ref: ${error.digest}` : undefined}
        className="w-full"
        action={<Button onClick={reset}>{t.common.retry}</Button>}
      />
    </main>
  );
}
