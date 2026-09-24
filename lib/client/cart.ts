"use client";

import { useSyncExternalStore } from "react";

/**
 * Cart (D18): one restaurant per cart, kept in localStorage. Prices here are
 * for display only — the server re-prices every line from the live menu.
 */
export type CartLine = {
  key: string;
  itemId: string;
  name: string;
  emoji: string;
  qty: number;
  options: Record<string, string[]>;
  optionLabels: string[];
  unitPricePkr: number;
  prepMin: number;
};

export type Cart = {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  lines: CartLine[];
  note?: string;
} | null;

const KEY = "wp_cart_v1";
const listeners = new Set<() => void>();
let state: Cart = null;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as Cart) : null;
  } catch {
    state = null;
  }
}

function persist() {
  try {
    if (state && state.lines.length) window.localStorage.setItem(KEY, JSON.stringify(state));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* private mode — cart just won't persist */
  }
}

function set(next: Cart) {
  state = next && next.lines.length === 0 ? null : next;
  persist();
  listeners.forEach((l) => l());
}

export const cartStore = {
  get(): Cart {
    load();
    return state;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        loaded = false;
        load();
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  },
  /** Returns false if the cart belongs to another restaurant (caller asks to replace). */
  add(
    restaurant: { id: string; slug: string; name: string },
    line: Omit<CartLine, "key">,
    opts: { replace?: boolean } = {},
  ): boolean {
    const cur = cartStore.get();
    if (cur && cur.restaurantId !== restaurant.id && !opts.replace) return false;
    const base: NonNullable<Cart> =
      cur && cur.restaurantId === restaurant.id
        ? cur
        : { restaurantId: restaurant.id, restaurantSlug: restaurant.slug, restaurantName: restaurant.name, lines: [] };
    const key = `${line.itemId}:${JSON.stringify(Object.entries(line.options).sort())}`;
    const existing = base.lines.find((l) => l.key === key);
    const lines = existing
      ? base.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l))
      : [...base.lines, { ...line, key }];
    set({ ...base, lines });
    return true;
  },
  setQty(key: string, qty: number) {
    const cur = cartStore.get();
    if (!cur) return;
    set({ ...cur, lines: cur.lines.map((l) => (l.key === key ? { ...l, qty } : l)).filter((l) => l.qty > 0) });
  },
  setNote(note: string) {
    const cur = cartStore.get();
    if (cur) set({ ...cur, note });
  },
  /** Replace the whole cart (reorder). */
  replace(next: Cart) {
    set(next);
  },
  clear() {
    set(null);
  },
};

export function useCart(): Cart {
  return useSyncExternalStore(cartStore.subscribe, cartStore.get, () => null);
}

export function cartCount(cart: Cart): number {
  return cart?.lines.reduce((n, l) => n + l.qty, 0) ?? 0;
}

export function cartSubtotal(cart: Cart): number {
  return cart?.lines.reduce((n, l) => n + l.qty * l.unitPricePkr, 0) ?? 0;
}
