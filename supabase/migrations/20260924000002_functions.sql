-- ============================================================================
-- WaqtPe · 002 · Functions, triggers, state machine
--
-- The guarantee *decisions* (ETA, eligibility, free amount, attribution) are made by
-- the server in lib/guarantee (pure TS, unit-tested). The database is the referee:
--   • it owns the clock (app_now),
--   • it enforces the order state machine (transition_order + guard trigger),
--   • it refuses outcomes that break invariants (apply_guarantee_outcome).
-- Errors are raised as 'WP:<code>' so the server can map them to friendly copy.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Clock. Real DB time, or warped time while the dev-only time warp is on.
-- ---------------------------------------------------------------------------
create or replace function public.app_now()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select case
              when s.warp_factor = 1 then now()
              else s.warp_app_anchor + (now() - s.warp_real_anchor) * s.warp_factor::double precision
            end
       from public.app_settings s
      where s.id),
    now()
  );
$$;

-- What the browser syncs its countdown to (via /api/time).
create or replace function public.server_clock()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'app_now_ms',  floor(extract(epoch from public.app_now()) * 1000)::bigint,
    'real_now_ms', floor(extract(epoch from now()) * 1000)::bigint,
    'warp_factor', coalesce((select warp_factor from public.app_settings where id), 1)
  );
$$;

create or replace function public.karachi_day_start()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select date_trunc('day', public.app_now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
$$;

alter table public.order_events alter column at set default public.app_now();

-- ---------------------------------------------------------------------------
-- Who am I? (used by RLS policies)
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.my_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.profiles where id = auth.uid() and role = 'restaurant';
$$;

-- ---------------------------------------------------------------------------
-- New auth user → profile. Role is ALWAYS 'customer' here; only the server
-- (service role) can promote someone to restaurant/rider/admin.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Orders guard: no inserts outside create_order, no status changes outside
-- transition_order, immutable promise fields, guarantee fields only via
-- apply_guarantee_outcome, and free is irreversible.
-- ---------------------------------------------------------------------------
create or replace function public.orders_guard()
returns trigger
language plpgsql
as $$
declare
  v_ctx text := coalesce(current_setting('waqtpe.ctx', true), '');
begin
  if tg_op = 'INSERT' then
    if v_ctx <> 'create_order' then
      raise exception 'WP:use_create_order';
    end if;
    if new.status <> 'placed' then
      raise exception 'WP:orders_start_placed';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status and v_ctx <> 'transition' then
    raise exception 'WP:status_change_must_use_transition_order';
  end if;

  if new.placed_at          is distinct from old.placed_at
  or new.promised_by        is distinct from old.promised_by
  or new.accept_by          is distinct from old.accept_by
  or new.guarantee_active   is distinct from old.guarantee_active
  or new.window_min         is distinct from old.window_min
  or new.total_pkr          is distinct from old.total_pkr
  or new.items_subtotal_pkr is distinct from old.items_subtotal_pkr
  or new.delivery_fee_pkr   is distinct from old.delivery_fee_pkr
  or new.free_cap_pkr       is distinct from old.free_cap_pkr
  or new.customer_id        is distinct from old.customer_id
  or new.restaurant_id      is distinct from old.restaurant_id
  or new.planned_delivery_min is distinct from old.planned_delivery_min then
    raise exception 'WP:immutable_order_field';
  end if;

  if (new.guarantee_state       is distinct from old.guarantee_state
   or new.free_amount_pkr       is distinct from old.free_amount_pkr
   or new.amount_to_collect_pkr is distinct from old.amount_to_collect_pkr
   or new.late_cause            is distinct from old.late_cause
   or new.late_by_sec           is distinct from old.late_by_sec
   or new.restaurant_charge_pkr is distinct from old.restaurant_charge_pkr)
  and v_ctx not in ('outcome', 'transition') then
    raise exception 'WP:guarantee_fields_use_apply_outcome';
  end if;

  if old.guarantee_state = 'free' and new.guarantee_state <> 'free' then
    raise exception 'WP:free_is_irreversible';
  end if;

  if new.committed_prep_min is distinct from old.committed_prep_min and v_ctx <> 'transition' then
    raise exception 'WP:committed_prep_is_set_on_accept';
  end if;

  return new;
end;
$$;

create trigger orders_guard
  before insert or update on public.orders
  for each row execute function public.orders_guard();

-- Nudge the rider app (via realtime on riders) whenever their job changes.
create or replace function public.orders_bump_rider_rev()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rider_id is not null then
    update public.riders set job_rev = job_rev + 1 where id = new.rider_id;
  end if;
  if old.rider_id is not null and old.rider_id is distinct from new.rider_id then
    update public.riders set job_rev = job_rev + 1 where id = old.rider_id;
  end if;
  return null;
end;
$$;

create trigger orders_bump_rider_rev
  after update on public.orders
  for each row execute function public.orders_bump_rider_rev();

-- Append-only audit log (only the dev reset below may delete, together with its order).
create or replace function public.order_events_append_only()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and coalesce(current_setting('waqtpe.ctx', true), '') = 'dev_reset' then
    return old;
  end if;
  raise exception 'WP:order_events_are_append_only';
end;
$$;

create trigger order_events_append_only
  before update or delete on public.order_events
  for each row execute function public.order_events_append_only();

-- ---------------------------------------------------------------------------
-- create_order(p) — called by the server AFTER lib/guarantee eligibility passed.
-- The DB sets every time field and re-checks the cheap invariants.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(p jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  s            public.app_settings;
  r            public.restaurants;
  v_now        timestamptz := public.app_now();
  v_guarantee  boolean := coalesce((p ->> 'guarantee_active')::boolean, false);
  v_item       jsonb;
  v_menu       public.menu_items;
  v_subtotal   int := 0;
  v_fee        int := (p ->> 'delivery_fee_pkr')::int;
  v_total      int;
  v_order      public.orders;
begin
  select * into s from public.app_settings where id;

  select * into r from public.restaurants where id = (p ->> 'restaurant_id')::uuid;
  if not found or not r.is_active then
    raise exception 'WP:restaurant_unavailable';
  end if;
  if not r.is_accepting then
    raise exception 'WP:restaurant_closed';
  end if;
  if r.paused_until is not null and r.paused_until > v_now then
    raise exception 'WP:restaurant_paused';
  end if;

  -- Rule 9: Rain Mode means no guarantee, ever.
  if s.rain_mode and v_guarantee then
    raise exception 'WP:rain_mode_no_guarantee';
  end if;
  -- Rule 5: never promise what we predict we can't keep.
  if v_guarantee and (p ->> 'predicted_eta_min')::int > s.max_eta_min then
    raise exception 'WP:eta_too_long';
  end if;
  if coalesce(p ->> 'payment_method', 'cod') <> 'cod' then
    raise exception 'WP:payment_method_unavailable';
  end if;
  if v_fee is distinct from s.delivery_fee_pkr then
    raise exception 'WP:delivery_fee_mismatch';
  end if;

  if jsonb_typeof(p -> 'items') is distinct from 'array' or jsonb_array_length(p -> 'items') = 0 then
    raise exception 'WP:empty_cart';
  end if;

  -- Rule 8: fast lane only; items must be live, in stock, and from this restaurant.
  for v_item in select value from jsonb_array_elements(p -> 'items') loop
    select * into v_menu from public.menu_items where id = (v_item ->> 'menu_item_id')::uuid;
    if not found or v_menu.restaurant_id <> r.id or not v_menu.is_active then
      raise exception 'WP:item_unavailable';
    end if;
    if not v_menu.is_available then
      raise exception 'WP:item_out_of_stock';
    end if;
    if v_menu.prep_min > s.fast_lane_max_prep_min then
      raise exception 'WP:item_not_fast_lane';
    end if;
    v_subtotal := v_subtotal + (v_item ->> 'line_total_pkr')::int;
  end loop;

  if v_subtotal <> (p ->> 'items_subtotal_pkr')::int then
    raise exception 'WP:subtotal_mismatch';
  end if;
  v_total := v_subtotal + v_fee;

  perform set_config('waqtpe.ctx', 'create_order', true);

  insert into public.orders (
    customer_id, restaurant_id, address_id,
    drop_lat, drop_lng, drop_address, drop_gate_note,
    customer_name, customer_phone, customer_note,
    status,
    items_subtotal_pkr, delivery_fee_pkr, total_pkr,
    free_cap_pkr, free_amount_pkr, amount_to_collect_pkr, payment_method,
    guarantee_active, guarantee_state, window_min,
    placed_at, accept_by, promised_by,
    predicted_eta_min, predicted_prep_min, predicted_rider_min, predicted_ride_min,
    planned_delivery_min, distance_km, settings_snapshot, is_simulated
  ) values (
    (p ->> 'customer_id')::uuid, r.id, nullif(p ->> 'address_id', '')::uuid,
    (p ->> 'drop_lat')::double precision, (p ->> 'drop_lng')::double precision,
    p ->> 'drop_address', nullif(p ->> 'drop_gate_note', ''),
    coalesce(p ->> 'customer_name', ''), nullif(p ->> 'customer_phone', ''), nullif(p ->> 'customer_note', ''),
    'placed',
    v_subtotal, v_fee, v_total,
    s.free_cap_pkr, 0, v_total, 'cod',
    v_guarantee,
    case when v_guarantee then 'active'::public.guarantee_state else 'off'::public.guarantee_state end,
    s.guarantee_window_min,
    v_now,
    v_now + make_interval(secs => s.accept_timeout_sec),
    case when v_guarantee then v_now + make_interval(mins => s.guarantee_window_min) end,
    (p ->> 'predicted_eta_min')::int,
    (p ->> 'predicted_prep_min')::int,
    coalesce((p ->> 'predicted_rider_min')::numeric, 0),
    (p ->> 'predicted_ride_min')::numeric,
    (p ->> 'planned_delivery_min')::numeric,
    (p ->> 'distance_km')::numeric,
    to_jsonb(s) - 'warp_real_anchor' - 'warp_app_anchor' - 'updated_by',
    coalesce((p ->> 'is_simulated')::boolean, false)
  )
  returning * into v_order;

  perform set_config('waqtpe.ctx', '', true);

  insert into public.order_items (
    order_id, menu_item_id, name, emoji, unit_price_pkr, qty, options, line_total_pkr, prep_min
  )
  select v_order.id,
         (i ->> 'menu_item_id')::uuid,
         i ->> 'name',
         coalesce(i ->> 'emoji', '🍽️'),
         (i ->> 'unit_price_pkr')::int,
         (i ->> 'qty')::int,
         coalesce(i -> 'options', '[]'::jsonb),
         (i ->> 'line_total_pkr')::int,
         (i ->> 'prep_min')::int
    from jsonb_array_elements(p -> 'items') as i;

  insert into public.payments (order_id, method, amount_total_pkr, amount_due_pkr)
  values (v_order.id, v_order.payment_method, v_order.total_pkr, v_order.total_pkr);

  insert into public.order_events (order_id, kind, to_status, actor_id, actor_role, at, meta)
  values (
    v_order.id, 'status', 'placed', v_order.customer_id,
    case when v_order.is_simulated then 'system' else 'customer' end,
    v_now,
    jsonb_build_object(
      'guarantee_active', v_guarantee,
      'predicted_eta_min', v_order.predicted_eta_min,
      'total_pkr', v_order.total_pkr
    )
  );

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- transition_order — THE state machine. No other path can change status.
-- ---------------------------------------------------------------------------
create or replace function public.transition_order(
  p_order_id   uuid,
  p_to         public.order_status,
  p_actor_id   uuid,
  p_actor_role text,
  p_patch      jsonb default '{}'::jsonb,
  p_meta       jsonb default '{}'::jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now     timestamptz := public.app_now();
  o         public.orders;
  v_from    public.order_status;
  v_roles   text[];
  v_actor   public.profiles;
  v_prep    int;
  v_reason  text;
  v_within  boolean;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'WP:order_not_found';
  end if;
  v_from := o.status;

  select roles into v_roles
    from public.order_transitions
   where from_status = o.status and to_status = p_to;
  if v_roles is null then
    raise exception 'WP:invalid_transition' using detail = format('%s -> %s', o.status, p_to);
  end if;
  if not (p_actor_role = any (v_roles)) then
    raise exception 'WP:forbidden_transition'
      using detail = format('%s may not move %s -> %s', p_actor_role, o.status, p_to);
  end if;

  -- The caller claims an identity; verify it against profiles.
  if p_actor_role <> 'system' then
    select * into v_actor from public.profiles where id = p_actor_id;
    if not found or v_actor.role::text <> p_actor_role then
      raise exception 'WP:actor_mismatch';
    end if;
    if p_actor_role = 'restaurant' and v_actor.restaurant_id is distinct from o.restaurant_id then
      raise exception 'WP:not_your_restaurant';
    end if;
    if p_actor_role = 'rider' and o.rider_id is distinct from p_actor_id then
      raise exception 'WP:not_your_job';
    end if;
    if p_actor_role = 'customer' and o.customer_id <> p_actor_id then
      raise exception 'WP:not_your_order';
    end if;
  end if;

  perform set_config('waqtpe.ctx', 'transition', true);

  case p_to
    when 'accepted' then
      if v_now > o.accept_by then
        raise exception 'WP:accept_window_expired';
      end if;
      v_prep := (p_patch ->> 'committed_prep_min')::int;
      if v_prep is null or v_prep < 1 or v_prep > 90 then
        raise exception 'WP:committed_prep_required';
      end if;
      update public.orders
         set status = 'accepted',
             accepted_at = v_now,
             committed_prep_min = v_prep,
             ready_by = v_now + make_interval(mins => v_prep)
       where id = o.id
      returning * into o;

    when 'rejected' then
      v_reason := nullif(trim(p_patch ->> 'reason'), '');
      if v_reason is null then
        raise exception 'WP:reason_required';
      end if;
      update public.orders
         set status = 'rejected',
             rejected_at = v_now,
             reject_reason = v_reason,
             guarantee_state = case when guarantee_state = 'free' then guarantee_state
                                    else 'void'::public.guarantee_state end
       where id = o.id
      returning * into o;
      update public.payments set status = 'void' where order_id = o.id and status in ('pending', 'waived');

    when 'cancelled' then
      v_reason := nullif(trim(p_patch ->> 'reason'), '');
      if v_reason is null then
        raise exception 'WP:reason_required';
      end if;
      update public.orders
         set status = 'cancelled',
             cancelled_at = v_now,
             cancel_reason = v_reason,
             cancelled_by = p_actor_role,
             guarantee_state = case when guarantee_state = 'free' then guarantee_state
                                    else 'void'::public.guarantee_state end
       where id = o.id
      returning * into o;
      update public.payments set status = 'void' where order_id = o.id and status in ('pending', 'waived');
      if o.rider_id is not null then
        update public.riders
           set status = case when status = 'busy' then 'idle'::public.rider_status else status end,
               current_order_id = null
         where id = o.rider_id and current_order_id = o.id;
      end if;

    when 'ready' then
      update public.orders
         set status = 'ready',
             ready_at = v_now,
             sealed_bag_photo_url = coalesce(nullif(p_patch ->> 'sealed_bag_photo_url', ''), sealed_bag_photo_url)
       where id = o.id
      returning * into o;

    when 'picked_up' then
      if o.rider_id is null then
        raise exception 'WP:no_rider_assigned';
      end if;
      update public.orders
         set status = 'picked_up',
             picked_up_at = v_now
       where id = o.id
      returning * into o;

    when 'arrived' then
      -- Rule 2: inside the geofence, or a reason (→ flagged for review).
      v_within := coalesce((p_patch ->> 'within_geofence')::boolean, false);
      v_reason := nullif(trim(p_patch ->> 'reason'), '');
      if not v_within and v_reason is null then
        raise exception 'WP:outside_geofence_reason_required';
      end if;
      update public.orders
         set status = 'arrived',
             arrived_at = v_now,
             arrival_lat = (p_patch ->> 'lat')::double precision,
             arrival_lng = (p_patch ->> 'lng')::double precision,
             arrival_accuracy_m = (p_patch ->> 'accuracy_m')::double precision,
             arrival_distance_m = (p_patch ->> 'distance_m')::double precision,
             arrival_within_geofence = v_within,
             arrival_reason = v_reason,
             arrival_flagged = not v_within
       where id = o.id
      returning * into o;

    when 'delivered' then
      update public.orders
         set status = 'delivered',
             delivered_at = v_now
       where id = o.id
      returning * into o;
      update public.payments
         set status = case when o.amount_to_collect_pkr = 0 then 'waived'::public.payment_status
                           else 'collected'::public.payment_status end,
             amount_due_pkr = o.amount_to_collect_pkr,
             amount_waived_pkr = o.free_amount_pkr,
             amount_collected_pkr = coalesce((p_patch ->> 'amount_collected_pkr')::int, o.amount_to_collect_pkr),
             collected_by = coalesce(o.rider_id, p_actor_id),
             collected_at = v_now
       where order_id = o.id;
      if o.rider_id is not null then
        update public.riders
           set status = case when status = 'busy' then 'idle'::public.rider_status else status end,
               current_order_id = null
         where id = o.rider_id and current_order_id = o.id;
      end if;

    else
      raise exception 'WP:invalid_transition';
  end case;

  perform set_config('waqtpe.ctx', '', true);

  insert into public.order_events (order_id, kind, from_status, to_status, actor_id, actor_role, at, meta)
  values (o.id, 'status', v_from, p_to, p_actor_id, p_actor_role, v_now,
          coalesce(p_meta, '{}'::jsonb) || jsonb_strip_nulls(coalesce(p_patch, '{}'::jsonb)));

  return o;
end;
$$;

-- ---------------------------------------------------------------------------
-- apply_guarantee_outcome — writes what lib/guarantee decided, after checking
-- it against the clock. The DB will refuse a "free" that isn't late, an
-- "on_time" that is, a free amount that isn't min(total, cap), and un-freeing.
-- ---------------------------------------------------------------------------
create or replace function public.apply_guarantee_outcome(p_order_id uuid, p jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now       timestamptz := public.app_now();
  o           public.orders;
  v_prev      public.guarantee_state;
  v_state     public.guarantee_state := (p ->> 'guarantee_state')::public.guarantee_state;
  v_free      int := coalesce((p ->> 'free_amount_pkr')::int, 0);
  v_charge    int := coalesce((p ->> 'restaurant_charge_pkr')::int, 0);
  v_finalize  boolean := coalesce((p ->> 'finalize')::boolean, false);
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'WP:order_not_found';
  end if;
  v_prev := o.guarantee_state;

  if v_prev = 'free' and v_state <> 'free' then
    raise exception 'WP:free_is_irreversible';
  end if;

  if not o.guarantee_active then
    if v_state <> v_prev then
      raise exception 'WP:guarantee_off';
    end if;
  elsif v_state = 'free' then
    if not ((o.arrived_at is null and v_now >= o.promised_by)
            or o.arrived_at > o.promised_by
            or v_prev = 'free') then
      raise exception 'WP:not_late';
    end if;
    if v_prev = 'void' then
      raise exception 'WP:order_void';
    end if;
    if v_free <> least(o.total_pkr, o.free_cap_pkr) then
      raise exception 'WP:free_amount_must_equal_min_total_cap';
    end if;
  elsif v_state = 'on_time' then
    if o.arrived_at is null or o.arrived_at > o.promised_by then
      raise exception 'WP:not_on_time';
    end if;
  elsif v_state = 'void' then
    if v_prev <> 'void' then
      raise exception 'WP:void_is_set_by_transition';
    end if;
  else
    raise exception 'WP:bad_outcome_state';
  end if;

  if v_state <> 'free' and v_free <> 0 then
    raise exception 'WP:free_amount_without_free';
  end if;
  if v_charge < 0 or v_charge > v_free then
    raise exception 'WP:restaurant_charge_out_of_range';
  end if;
  if v_finalize and o.status not in ('arrived', 'delivered', 'cancelled', 'rejected') then
    raise exception 'WP:cannot_finalize_yet';
  end if;

  perform set_config('waqtpe.ctx', 'outcome', true);
  update public.orders
     set guarantee_state = v_state,
         free_amount_pkr = v_free,
         amount_to_collect_pkr = total_pkr - v_free,
         late_by_sec = (p ->> 'late_by_sec')::int,
         late_cause = (p ->> 'late_cause')::public.late_cause,
         kitchen_overrun_sec = (p ->> 'kitchen_overrun_sec')::int,
         delivery_overrun_sec = (p ->> 'delivery_overrun_sec')::int,
         restaurant_charge_pkr = v_charge,
         outcome_finalized_at = case when v_finalize then v_now else outcome_finalized_at end
   where id = o.id
  returning * into o;
  perform set_config('waqtpe.ctx', '', true);

  update public.payments
     set amount_waived_pkr = o.free_amount_pkr,
         amount_due_pkr = o.amount_to_collect_pkr,
         status = case when status = 'pending' and o.amount_to_collect_pkr = 0 then 'waived'::public.payment_status
                       else status end
   where order_id = o.id and status in ('pending', 'waived');

  if v_prev is distinct from v_state or v_finalize then
    insert into public.order_events (order_id, kind, actor_role, at, meta)
    values (o.id, 'guarantee', 'system', v_now, p || jsonb_build_object('from_state', v_prev));
  end if;

  return o;
end;
$$;

-- ---------------------------------------------------------------------------
-- assign_rider — auto-assignment (system) or manual (admin). null = unassign.
-- ---------------------------------------------------------------------------
create or replace function public.assign_rider(
  p_order_id    uuid,
  p_rider_id    uuid,
  p_actor_id    uuid,
  p_actor_role  text,
  p_payout_pkr  int default 0
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now   timestamptz := public.app_now();
  o       public.orders;
  r       public.riders;
  v_prev  uuid;
begin
  if p_actor_role not in ('system', 'admin') then
    raise exception 'WP:forbidden_assign';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'WP:order_not_found';
  end if;
  if o.status not in ('accepted', 'ready', 'picked_up') then
    raise exception 'WP:cannot_assign_in_status' using detail = o.status::text;
  end if;
  v_prev := o.rider_id;

  if p_rider_id is not null then
    select * into r from public.riders where id = p_rider_id for update;
    if not found or not r.is_active then
      raise exception 'WP:rider_unavailable';
    end if;
    if r.status = 'busy' and r.current_order_id is distinct from o.id then
      raise exception 'WP:rider_busy';
    end if;
    if r.status = 'offline' and p_actor_role <> 'admin' then
      raise exception 'WP:rider_offline';
    end if;
  end if;

  if v_prev is not null and v_prev is distinct from p_rider_id then
    update public.riders
       set status = case when status = 'busy' then 'idle'::public.rider_status else status end,
           current_order_id = null
     where id = v_prev and current_order_id = o.id;
  end if;

  if p_rider_id is not null then
    update public.riders set status = 'busy', current_order_id = o.id where id = p_rider_id;
  end if;

  update public.orders
     set rider_id = p_rider_id,
         rider_assigned_at = case when p_rider_id is null then null else v_now end,
         rider_payout_pkr = case when p_rider_id is null then 0 else greatest(coalesce(p_payout_pkr, 0), 0) end
   where id = o.id
  returning * into o;

  insert into public.order_events (order_id, kind, actor_id, actor_role, at, meta)
  values (o.id, 'assigned', p_actor_id, p_actor_role, v_now,
          jsonb_build_object('from_rider', v_prev, 'to_rider', p_rider_id, 'payout_pkr', o.rider_payout_pkr));

  return o;
end;
$$;

-- ---------------------------------------------------------------------------
-- Sweep candidates — what the background sweep needs to look at, by DB time.
-- ---------------------------------------------------------------------------
create or replace function public.sweep_candidates()
returns table (order_id uuid, reason text)
language sql
stable
security definer
set search_path = public
as $$
  select id, 'accept_timeout' from public.orders
   where status = 'placed' and accept_by < public.app_now()
  union all
  select id, 'deadline_passed' from public.orders
   where guarantee_active and guarantee_state = 'active'
     and status in ('placed', 'accepted', 'ready', 'picked_up')
     and promised_by <= public.app_now()
  union all
  select id, 'finalize' from public.orders
   where status in ('arrived', 'delivered') and outcome_finalized_at is null
  union all
  select id, 'needs_rider' from public.orders
   where status in ('accepted', 'ready') and rider_id is null;
$$;

-- ---------------------------------------------------------------------------
-- Time warp (dev only)
-- ---------------------------------------------------------------------------
create or replace function public.set_time_warp(p_factor numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s      public.app_settings;
  v_app  timestamptz := public.app_now();
begin
  select * into s from public.app_settings where id for update;
  if p_factor is null or p_factor < 1 or p_factor > 60 then
    raise exception 'WP:bad_warp_factor';
  end if;
  if p_factor <> 1 and not s.dev_tools_enabled then
    raise exception 'WP:dev_tools_disabled';
  end if;

  if p_factor = 1 then
    -- Snap back to real time.
    update public.app_settings
       set warp_factor = 1, warp_real_anchor = now(), warp_app_anchor = now()
     where id;
  else
    -- Continuous: app time keeps flowing from where it is now, just faster.
    update public.app_settings
       set warp_factor = p_factor, warp_real_anchor = now(), warp_app_anchor = v_app
     where id;
  end if;

  return public.server_clock();
end;
$$;

-- ---------------------------------------------------------------------------
-- Stats
-- ---------------------------------------------------------------------------

-- Customer home "on-time score" card. Aggregates only — safe for anyone.
create or replace function public.public_on_time_score()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'deliveries', count(*),
    'avg_min', round((avg(extract(epoch from arrived_at - placed_at)) / 60.0)::numeric, 1),
    'on_time_pct', round((100.0 * count(*) filter (where guarantee_state = 'on_time')
                   / nullif(count(*) filter (where guarantee_active), 0))::numeric, 0),
    'min_required', (select on_time_score_min_deliveries from public.app_settings where id)
  )
  from public.orders
  where arrived_at is not null
    and not is_simulated
    and placed_at >= public.app_now() - interval '7 days';
$$;

create or replace function public.restaurant_today(p_restaurant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with o as (
    select * from public.orders
     where restaurant_id = p_restaurant_id and placed_at >= public.karachi_day_start()
  )
  select jsonb_build_object(
    'orders', count(*),
    'completed', count(*) filter (where status in ('arrived', 'delivered')),
    'active', count(*) filter (where status in ('placed', 'accepted', 'ready', 'picked_up')),
    'rejected', count(*) filter (where status = 'rejected'),
    'timeouts', count(*) filter (where status = 'cancelled' and cancel_reason = 'restaurant_timeout'),
    'on_time_pct', round((100.0 * count(*) filter (where guarantee_state = 'on_time')
                   / nullif(count(*) filter (where guarantee_active and guarantee_state in ('on_time', 'free')), 0))::numeric, 0),
    'late', count(*) filter (where guarantee_state = 'free'),
    'kitchen_lates', count(*) filter (where late_cause = 'kitchen'),
    'kitchen_charges_pkr', coalesce(sum(restaurant_charge_pkr), 0),
    'sales_pkr', coalesce(sum(items_subtotal_pkr) filter (where status in ('arrived', 'delivered')), 0),
    'avg_prep_min', round((avg(extract(epoch from ready_at - accepted_at)) / 60.0)::numeric, 1)
  )
  from o;
$$;

create or replace function public.rider_today(p_rider_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with o as (
    select * from public.orders
     where rider_id = p_rider_id and status = 'delivered' and delivered_at >= public.karachi_day_start()
  )
  select jsonb_build_object(
    'jobs', count(*),
    'earnings_pkr', coalesce(sum(rider_payout_pkr), 0),
    'cash_collected_pkr', coalesce(sum(amount_to_collect_pkr), 0),
    'km', round(coalesce(sum(distance_km), 0)::numeric, 1)
  )
  from o;
$$;

create or replace function public.analytics_report(
  p_from timestamptz,
  p_to timestamptz,
  p_include_sim boolean default false
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with o as (
    select * from public.orders
     where placed_at >= p_from and placed_at < p_to and (p_include_sim or not is_simulated)
  ),
  done as (
    select * from o where arrived_at is not null
  )
  select jsonb_build_object(
    'orders',          (select count(*) from o),
    'delivered',       (select count(*) from o where status = 'delivered'),
    'arrived',         (select count(*) from done),
    'rejected',        (select count(*) from o where status = 'rejected'),
    'cancelled',       (select count(*) from o where status = 'cancelled'),
    'timeouts',        (select count(*) from o where status = 'cancelled' and cancel_reason = 'restaurant_timeout'),
    'gmv_pkr',         (select coalesce(sum(total_pkr), 0) from o where status in ('arrived', 'delivered')),
    'avg_delivery_min',(select round((avg(extract(epoch from arrived_at - placed_at)) / 60.0)::numeric, 1) from done),
    'on_time_pct',     (select round((100.0 * count(*) filter (where guarantee_state = 'on_time')
                               / nullif(count(*) filter (where guarantee_active), 0))::numeric, 1) from done),
    'free_orders',     (select count(*) from o where guarantee_state = 'free'),
    'free_cost_pkr',   (select coalesce(sum(free_amount_pkr), 0) from o where guarantee_state = 'free'),
    'kitchen_charges_pkr', (select coalesce(sum(restaurant_charge_pkr), 0) from o),
    'flagged_arrivals',(select count(*) from o where arrival_flagged),
    'lates_by_cause',  (select coalesce(jsonb_object_agg(cause, n), '{}'::jsonb)
                          from (select coalesce(late_cause::text, 'pending') as cause, count(*) as n
                                  from o where guarantee_state = 'free' group by 1) x),
    'by_restaurant',   (select coalesce(jsonb_agg(to_jsonb(x) order by x.orders desc), '[]'::jsonb)
                          from (select r.id, r.name,
                                       count(*) as orders,
                                       count(*) filter (where o.guarantee_state = 'on_time') as on_time,
                                       count(*) filter (where o.guarantee_state = 'free') as late,
                                       count(*) filter (where o.late_cause = 'kitchen') as kitchen_lates,
                                       round((avg(extract(epoch from o.arrived_at - o.placed_at)) / 60.0)::numeric, 1) as avg_min,
                                       coalesce(sum(o.free_amount_pkr), 0) as free_cost_pkr,
                                       coalesce(sum(o.restaurant_charge_pkr), 0) as charged_pkr
                                  from o join public.restaurants r on r.id = o.restaurant_id
                                 group by r.id, r.name) x),
    'by_hour',         (select coalesce(jsonb_agg(to_jsonb(x) order by x.hour), '[]'::jsonb)
                          from (select extract(hour from placed_at at time zone 'Asia/Karachi')::int as hour,
                                       count(*) as orders,
                                       count(*) filter (where guarantee_state = 'free') as late,
                                       round((avg(extract(epoch from arrived_at - placed_at)) / 60.0)::numeric, 1) as avg_min
                                  from o group by 1) x)
  );
$$;

-- ---------------------------------------------------------------------------
-- Dev reset (simulation clean-up / fresh pilot start). Refuses unless dev tools
-- are enabled in app_settings.
-- ---------------------------------------------------------------------------
create or replace function public.dev_delete_orders(p_only_simulated boolean default true)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if not (select dev_tools_enabled from public.app_settings where id) then
    raise exception 'WP:dev_tools_disabled';
  end if;

  update public.riders
     set status = case when status = 'busy' then 'idle'::public.rider_status else status end,
         current_order_id = null
   where current_order_id in (
     select id from public.orders where (not p_only_simulated) or is_simulated
   );

  perform set_config('waqtpe.ctx', 'dev_reset', true);
  delete from public.orders where (not p_only_simulated) or is_simulated;
  get diagnostics v_count = row_count;
  perform set_config('waqtpe.ctx', '', true);
  return v_count;
end;
$$;
