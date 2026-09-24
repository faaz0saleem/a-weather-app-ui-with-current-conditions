"use client";

import { Toaster } from "sonner";
import { MotionConfig } from "motion/react";
import { OfflineBanner } from "./offline-banner";
import { SystemThemeListener } from "./theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SystemThemeListener />
      <OfflineBanner />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast:
              "rounded-2xl! border-line! bg-card! text-ink! shadow-lift! font-sans!",
            description: "text-ink-soft!",
          },
        }}
      />
    </MotionConfig>
  );
}
