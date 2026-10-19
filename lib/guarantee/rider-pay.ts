import { roadKm } from "./eta";
import type { GuaranteeSettings } from "./settings";

/**
 * Rule 11: rider pay = base + per-km × road km, fixed at assignment.
 * This function deliberately takes NO timing or lateness input — there is no
 * way to cut a rider's pay for a late order.
 */
export function riderPayoutPkr(
  straightKm: number,
  s: Pick<GuaranteeSettings, "riderBasePayPkr" | "riderPerKmPkr" | "routeFactor">,
): number {
  return Math.round(s.riderBasePayPkr + s.riderPerKmPkr * roadKm(Math.max(0, straightKm), s));
}
