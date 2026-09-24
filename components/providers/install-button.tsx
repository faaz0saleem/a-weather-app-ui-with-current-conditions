"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Install app" (Android/desktop Chrome). iPhone users: Share → Add to Home Screen. */
export function InstallButton() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  if (!evt) return null;
  return (
    <Button
      variant="soft"
      className="mb-5 w-full"
      onClick={async () => {
        await evt.prompt();
        setEvt(null);
      }}
    >
      <Download /> Install the app
    </Button>
  );
}
