-- ============================================================================
-- Database invariant tests. Runs inside a transaction and rolls back.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/guarantee_invariants.sql
-- Requires the seed (npm run seed). Prints "ALL DB INVARIANT TESTS PASSED".
-- ============================================================================
\set QUIET on
\pset pager off
\o /dev/null
begin;

create or replace function pg_temp.expect_error(p_sql text, p_pattern text)
returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'EXPECTED ERROR matching % but statement succeeded: %', p_pattern, p_sql;
exception
  when others then
    if sqlerrm like 'EXPECTED ERROR%' then raise; end if;
    if sqlerrm not like p_pattern then
      raise exception 'Wrong error for %: got "%", wanted like "%"', p_sql, sqlerrm, p_pattern;
    end if;
end $$;

create temp table ctx as
select
  (select id from public.profiles where phone = '+923000000101') as customer_id,
  (select id from public.profiles where phone = '+923000000301') as kitchen_id,     -- Tikka Taiyaar
  (select id from public.profiles where phone = '+923000000302') as other_kitchen,  -- Degh & Dum
  (select id from public.profiles where phone = '+923000000201') as rider_id,
  (select id from public.profiles where phone = '+923000000202') as other_rider,
  (select id from public.profiles where phone = '+923000000001') as admin_id,
  (select id from public.restaurants where slug = 'tikka-taiyaar') as restaurant_id,
  (select id from public.menu_items where name = 'Chicken Tikka (Leg)') as item_id,
  (select id from public.menu_items where name = 'Mutton Chops (4)') as slow_item_id;

grant select on ctx to authenticated, anon;

create or replace function pg_temp.order_json(p_guarantee boolean, p_item uuid, p_eta int default 22)
returns jsonb language sql as $$
  select jsonb_build_object(
    'customer_id', c.customer_id, 'restaurant_id', c.restaurant_id,
    'drop_lat', 31.479, 'drop_lng', 74.386, 'drop_address', 'House 142, Y Block, Phase 3',
    'customer_name', 'Hassan', 'customer_phone', '+923000000101',
    'items', jsonb_build_array(jsonb_build_object(
      'menu_item_id', p_item, 'name', 'Chicken Tikka (Leg)', 'unit_price_pkr', 590, 'qty', 2,
      'options', '[]'::jsonb, 'line_total_pkr', 1180, 'prep_min', 10)),
    'items_subtotal_pkr', 1180, 'delivery_fee_pkr', 150,
    'guarantee_active', p_guarantee, 'predicted_eta_min', p_eta, 'predicted_prep_min', 10,
    'predicted_rider_min', 3, 'predicted_ride_min', 5, 'planned_delivery_min', 8, 'distance_km', 1.1)
  from ctx c
$$;

-- 1. No inserts outside create_order ------------------------------------------
select pg_temp.expect_error($q$
  insert into public.orders (customer_id, restaurant_id, drop_lat, drop_lng, drop_address,
    items_subtotal_pkr, delivery_fee_pkr, total_pkr, free_cap_pkr, amount_to_collect_pkr,
    guarantee_active, guarantee_state, window_min, placed_at, accept_by,
    predicted_eta_min, predicted_prep_min, predicted_ride_min, planned_delivery_min, distance_km)
  select customer_id, restaurant_id, 0, 0, 'x', 100, 150, 250, 3000, 250, false, 'off', 30, now(), now(), 1, 1, 1, 1, 1 from ctx
$q$, 'WP:use_create_order%');

-- 2. create_order sets the clock from the DB ---------------------------------
create temp table o1 as select * from public.create_order(pg_temp.order_json(true, (select item_id from ctx)));
do $$
declare o public.orders;
begin
  select * into o from o1;
  assert o.status = 'placed', 'starts placed';
  assert o.promised_by = o.placed_at + interval '30 minutes', 'promised_by = placed_at + 30 min';
  assert o.accept_by = o.placed_at + interval '120 seconds', 'accept_by = placed_at + 2 min';
  assert o.total_pkr = 1330 and o.amount_to_collect_pkr = 1330, 'totals';
  assert o.guarantee_state = 'active', 'guarantee active';
  assert (select count(*) from public.order_events where order_id = o.id) = 1, 'placed event logged';
  assert (select status from public.payments where order_id = o.id) = 'pending', 'payment pending';
end $$;

-- 3. Rule 8 / 5 / 9 invariants in create_order ---------------------------------
select pg_temp.expect_error(format('select public.create_order(%L)', pg_temp.order_json(true, (select slow_item_id from ctx))), 'WP:item_not_fast_lane%');
select pg_temp.expect_error(format('select public.create_order(%L)', pg_temp.order_json(true, (select item_id from ctx), 26)), 'WP:eta_too_long%');
update public.app_settings set rain_mode = true;
select pg_temp.expect_error(format('select public.create_order(%L)', pg_temp.order_json(true, (select item_id from ctx))), 'WP:rain_mode_no_guarantee%');
update public.app_settings set rain_mode = false;

-- 4. No status edits outside transition_order; no skipping ---------------------
select pg_temp.expect_error($q$ update public.orders set status = 'delivered' where id = (select id from o1) $q$, 'WP:status_change_must_use_transition_order%');
select pg_temp.expect_error($q$ update public.orders set promised_by = promised_by + interval '1 hour' where id = (select id from o1) $q$, 'WP:immutable_order_field%');
select pg_temp.expect_error($q$ update public.orders set guarantee_state = 'free' where id = (select id from o1) $q$, 'WP:guarantee_fields_use_apply_outcome%');
select pg_temp.expect_error($q$ select public.transition_order((select id from o1), 'ready', (select kitchen_id from ctx), 'restaurant') $q$, 'WP:invalid_transition%');
select pg_temp.expect_error($q$ select public.transition_order((select id from o1), 'accepted', (select other_kitchen from ctx), 'restaurant', '{"committed_prep_min": 10}') $q$, 'WP:not_your_restaurant%');
select pg_temp.expect_error($q$ select public.transition_order((select id from o1), 'accepted', (select customer_id from ctx), 'restaurant', '{"committed_prep_min": 10}') $q$, 'WP:actor_mismatch%');
select pg_temp.expect_error($q$ select public.transition_order((select id from o1), 'accepted', (select rider_id from ctx), 'rider', '{}') $q$, 'WP:forbidden_transition%');
select pg_temp.expect_error($q$ select public.transition_order((select id from o1), 'accepted', (select kitchen_id from ctx), 'restaurant', '{}') $q$, 'WP:committed_prep_required%');

-- 5. Happy path ---------------------------------------------------------------
select public.transition_order((select id from o1), 'accepted', (select kitchen_id from ctx), 'restaurant', '{"committed_prep_min": 10}');
select pg_temp.expect_error($q$ select public.assign_rider((select id from o1), (select rider_id from ctx), (select kitchen_id from ctx), 'restaurant', 150) $q$, 'WP:forbidden_assign%');
update public.riders set status = 'idle' where id in (select rider_id from ctx union select other_rider from ctx);
select public.assign_rider((select id from o1), (select rider_id from ctx), null, 'system', 150);
select public.transition_order((select id from o1), 'ready', (select kitchen_id from ctx), 'restaurant', '{"sealed_bag_photo_url": "https://x/bag.jpg"}');
select pg_temp.expect_error($q$ select public.transition_order((select id from o1), 'picked_up', (select other_rider from ctx), 'rider') $q$, 'WP:not_your_job%');
select public.transition_order((select id from o1), 'picked_up', (select rider_id from ctx), 'rider');
-- Rule 2: outside geofence needs a reason
select pg_temp.expect_error($q$ select public.transition_order((select id from o1), 'arrived', (select rider_id from ctx), 'rider', '{"within_geofence": false, "distance_m": 300}') $q$, 'WP:outside_geofence_reason_required%');
select public.transition_order((select id from o1), 'arrived', (select rider_id from ctx), 'rider', '{"within_geofence": true, "distance_m": 20, "lat": 31.479, "lng": 74.386}');
-- Rule 3: can't mark free when on time
select pg_temp.expect_error($q$ select public.apply_guarantee_outcome((select id from o1), '{"guarantee_state": "free", "free_amount_pkr": 1330}') $q$, 'WP:not_late%');
select public.apply_guarantee_outcome((select id from o1), '{"guarantee_state": "on_time", "finalize": true}');
select public.transition_order((select id from o1), 'delivered', (select rider_id from ctx), 'rider');
do $$
declare o public.orders; p public.payments;
begin
  select * into o from public.orders where id = (select id from o1);
  select * into p from public.payments where order_id = o.id;
  assert o.status = 'delivered' and o.guarantee_state = 'on_time', 'delivered on time';
  assert p.status = 'collected' and p.amount_collected_pkr = 1330, 'cash collected';
  assert (select status from public.riders where id = (select rider_id from ctx)) = 'idle', 'rider freed';
  assert (select count(*) from public.order_events where order_id = o.id and kind = 'status') = 6, 'six status events';
end $$;
select pg_temp.expect_error($q$ update public.order_events set meta = '{}' where order_id = (select id from o1) $q$, 'WP:order_events_are_append_only%');

-- 6. Late → free (time warp), irreversible, capped ------------------------------
create temp table o2 as select * from public.create_order(pg_temp.order_json(true, (select item_id from ctx)));
update public.app_settings set dev_tools_enabled = true;
select public.set_time_warp(60);
-- Move the warp anchor 31 app-minutes into the past-equivalent: pretend 31 real seconds passed.
update public.app_settings set warp_real_anchor = warp_real_anchor - interval '31 seconds';
do $$
begin
  assert public.app_now() >= (select promised_by from o2), 'warped clock is past the deadline';
end $$;
select pg_temp.expect_error($q$ select public.transition_order((select id from o2), 'accepted', (select kitchen_id from ctx), 'restaurant', '{"committed_prep_min": 10}') $q$, 'WP:accept_window_expired%');
select pg_temp.expect_error($q$ select public.apply_guarantee_outcome((select id from o2), '{"guarantee_state": "free", "free_amount_pkr": 999}') $q$, 'WP:free_amount_must_equal_min_total_cap%');
select public.apply_guarantee_outcome((select id from o2), '{"guarantee_state": "free", "free_amount_pkr": 1330, "late_by_sec": 60}');
do $$
declare o public.orders;
begin
  select * into o from public.orders where id = (select id from o2);
  assert o.guarantee_state = 'free' and o.amount_to_collect_pkr = 0, 'free → collect Rs 0';
  assert (select status from public.payments where order_id = o.id) = 'waived', 'payment waived';
end $$;
select pg_temp.expect_error($q$ select public.apply_guarantee_outcome((select id from o2), '{"guarantee_state": "on_time"}') $q$, 'WP:free_is_irreversible%');
select public.transition_order((select id from o2), 'cancelled', null, 'system', '{"reason": "restaurant_timeout"}');
do $$
begin
  assert (select guarantee_state from public.orders where id = (select id from o2)) = 'free', 'cancelling a free order keeps it free';
end $$;
select public.set_time_warp(1);

-- 7. RLS -----------------------------------------------------------------------
set local role anon;
select pg_temp.expect_error($q$ select count(*) from public.orders $q$, '%permission denied%');
do $$ begin assert (select count(*) from public.restaurants) = 15, 'anon sees the catalogue'; end $$;
select pg_temp.expect_error($q$ select public.transition_order(gen_random_uuid(), 'accepted', null, 'system') $q$, '%permission denied%');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', (select customer_id from ctx), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin assert (select count(*) from public.orders) = 2, 'customer sees own orders'; end $$;
do $$ begin assert (select count(*) from public.profiles) = 1, 'customer sees only own profile'; end $$;
select pg_temp.expect_error($q$ update public.profiles set role = 'admin' where id = auth.uid() $q$, '%permission denied%');
select pg_temp.expect_error($q$ select public.create_order('{}'::jsonb) $q$, '%permission denied%');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', (select rider_id from ctx), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin assert (select count(*) from public.orders) = 0, 'riders cannot read orders (rule 11)'; end $$;
do $$ begin assert (select count(*) from public.riders) = 1, 'rider sees only self'; end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', (select other_kitchen from ctx), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin assert (select count(*) from public.orders) = 0, 'other kitchens see nothing'; end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', (select kitchen_id from ctx), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin assert (select count(*) from public.orders) = 2, 'kitchen sees its orders'; end $$;
reset role;

\o
select 'ALL DB INVARIANT TESTS PASSED' as result;
rollback;
