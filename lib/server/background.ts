import "server-only";

import { sweep } from "./engine";

let ticking = false;

/** One background tick: the guarantee sweep (+ simulation step when running). */
export async function runBackgroundTick() {
  if (ticking) return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)) return;
  ticking = true;
  try {
    await sweep();
    const { simTickIfRunning } = await import("./sim");
    await simTickIfRunning();
  } finally {
    ticking = false;
  }
}
