"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Light / dark / system theme without a flash: an inline script in <head>
 * (ThemeScript, rendered by the server layout) sets the class before first
 * paint; this hook reads/writes the choice afterwards.
 */
export type ThemeChoice = "light" | "dark" | "system";
const KEY = "wp_theme";
const listeners = new Set<() => void>();

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "system" as ThemeChoice,
  );
  const setTheme = useCallback((choice: ThemeChoice) => {
    try {
      if (choice === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch {
      /* ignore */
    }
    applyTheme(choice);
    listeners.forEach((l) => l());
  }, []);
  return { theme, setTheme };
}

/** Follow the OS setting while the choice is "system". Mounted once in Providers. */
export function SystemThemeListener() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => read() === "system" && applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return null;
}
