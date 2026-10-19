import type { Tables } from "@/lib/supabase/database.types";

/**
 * Every number the guarantee depends on (rule 12). The source of truth is the
 * `app_settings` row; DEFAULT_SETTINGS mirrors the DB defaults and exists only
 * for tests and as a fallback shape.
 */
export type GuaranteeSettings = {
  guaranteeWindowMin: number;
  maxEtaMin: number;
  freeCapPkr: number;
  acceptTimeoutSec: number;
  geofenceM: number;
  fastLaneMaxPrepMin: number;
  kitchenChargePct: number;
  acceptBufferMin: number;
  handoffMin: number;
  riderSpeedKmh: number;
  routeFactor: number;
  queuePenaltyMin: number;
  riderSoonFreeMin: number;
  riderStaleSec: number;
  restaurantRadiusKm: number;
  deliveryFeePkr: number;
  rainMode: boolean;
  rainExtraMin: number;
  riderBasePayPkr: number;
  riderPerKmPkr: number;
  locationBroadcastSec: number;
  locationSaveSec: number;
  onTimeScoreMinDeliveries: number;
  devToolsEnabled: boolean;
  warpFactor: number;
  simRunning: boolean;
};

export const DEFAULT_SETTINGS: GuaranteeSettings = {
  guaranteeWindowMin: 30,
  maxEtaMin: 25,
  freeCapPkr: 3000,
  acceptTimeoutSec: 120,
  geofenceM: 75,
  fastLaneMaxPrepMin: 12,
  kitchenChargePct: 100,
  acceptBufferMin: 2,
  handoffMin: 3,
  riderSpeedKmh: 20,
  routeFactor: 1.35,
  queuePenaltyMin: 2,
  riderSoonFreeMin: 5,
  riderStaleSec: 120,
  restaurantRadiusKm: 4,
  deliveryFeePkr: 150,
  rainMode: false,
  rainExtraMin: 15,
  riderBasePayPkr: 120,
  riderPerKmPkr: 20,
  locationBroadcastSec: 5,
  locationSaveSec: 30,
  onTimeScoreMinDeliveries: 50,
  devToolsEnabled: false,
  warpFactor: 1,
  simRunning: false,
};

export type AppSettingsRow = Tables<"app_settings">;

export function settingsFromRow(row: AppSettingsRow): GuaranteeSettings {
  return {
    guaranteeWindowMin: row.guarantee_window_min,
    maxEtaMin: row.max_eta_min,
    freeCapPkr: row.free_cap_pkr,
    acceptTimeoutSec: row.accept_timeout_sec,
    geofenceM: row.geofence_m,
    fastLaneMaxPrepMin: row.fast_lane_max_prep_min,
    kitchenChargePct: row.kitchen_charge_pct,
    acceptBufferMin: row.accept_buffer_min,
    handoffMin: row.handoff_min,
    riderSpeedKmh: Number(row.rider_speed_kmh),
    routeFactor: Number(row.route_factor),
    queuePenaltyMin: row.queue_penalty_min,
    riderSoonFreeMin: row.rider_soon_free_min,
    riderStaleSec: row.rider_stale_sec,
    restaurantRadiusKm: Number(row.restaurant_radius_km),
    deliveryFeePkr: row.delivery_fee_pkr,
    rainMode: row.rain_mode,
    rainExtraMin: row.rain_extra_min,
    riderBasePayPkr: row.rider_base_pay_pkr,
    riderPerKmPkr: row.rider_per_km_pkr,
    locationBroadcastSec: row.location_broadcast_sec,
    locationSaveSec: row.location_save_sec,
    onTimeScoreMinDeliveries: row.on_time_score_min_deliveries,
    devToolsEnabled: row.dev_tools_enabled,
    warpFactor: Number(row.warp_factor),
    simRunning: row.sim_running,
  };
}
