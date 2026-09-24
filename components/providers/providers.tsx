"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { MotionConfig } from "motion/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !border-line !bg-card !text-ink !shadow-lift !font-sans",
              description: "!text-ink-soft",
            },
          }}
        />
      </MotionConfig>
    </ThemeProvider>
  );
}
