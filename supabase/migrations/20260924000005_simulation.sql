-- ============================================================================
-- WaqtPe · 005 · Simulation support (dev only)
-- Per-order knobs for simulated orders, e.g. {"slow_kitchen_min": 8, "slow_rider_factor": 1.5}
-- so ops can rehearse kitchen-caused vs delivery-caused lates.
-- ============================================================================
alter table public.orders add column sim jsonb;

comment on column public.orders.sim is 'Simulation knobs for is_simulated orders (dev tools only).';
