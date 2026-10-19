-- ============================================================================
-- WaqtPe · 001 · Core schema
-- Types, tables, indexes. Business rules live in 002 (functions) and 003 (RLS).
-- Money is integer PKR. Times are timestamptz (UTC), displayed in Asia/Karachi.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'restaurant', 'rider', 'admin');

create type public.order_status as enum (
  'placed', 'accepted', 'ready', 'picked_up', 'arrived', 'delivered', 'rejected', 'cancelled'
);

-- active  = clock running · on_time = arrived before deadline · free = late (irreversible)
-- off     = Rain Mode, no clock · void = rejected/cancelled, nothing charged
create type public.guarantee_state as enum ('active', 'on_time', 'free', 'off', 'void');

create type public.late_cause as enum ('kitchen', 'delivery');

create type public.rider_status as enum ('offline', 'idle', 'busy');

-- Only 'cod' is live. The rest exist so adding a provider is a code change, not a migration.
create type public.payment_method as enum ('cod', 'jazzcash', 'easypaisa', 'card');

create type public.payment_status as enum ('pending', 'collected', 'waived', 'void', 'refunded');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- app_settings — single row holding every guarantee number (rule 12)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  id boolean primary key default true check (id),

  -- The promise
  guarantee_window_min      int     not null default 30   check (guarantee_window_min between 10 and 120),
  max_eta_min               int     not null default 25   check (max_eta_min between 5 and 120),
  free_cap_pkr              int     not null default 3000 check (free_cap_pkr >= 0),
  accept_timeout_sec        int     not null default 120  check (accept_timeout_sec between 30 and 900),
  geofence_m                int     not null default 75   check (geofence_m between 10 and 1000),
  fast_lane_max_prep_min    int     not null default 12   check (fast_lane_max_prep_min between 1 and 60),
  kitchen_charge_pct        int     not null default 100  check (kitchen_charge_pct between 0 and 100),

  -- ETA model (rule 6)
  accept_buffer_min         int     not null default 2    check (accept_buffer_min between 0 and 30),
  handoff_min               int     not null default 3    check (handoff_min between 0 and 30),
  rider_speed_kmh           numeric(5,2) not null default 20   check (rider_speed_kmh between 5 and 80),
  route_factor              numeric(4,2) not null default 1.35 check (route_factor between 1 and 3),
  queue_penalty_min         int     not null default 2    check (queue_penalty_min between 0 and 30),
  rider_soon_free_min       int     not null default 5    check (rider_soon_free_min between 0 and 30),
  rider_stale_sec           int     not null default 120  check (rider_stale_sec between 15 and 3600),

  -- Coverage & fees
  restaurant_radius_km      numeric(5,2) not null default 4 check (restaurant_radius_km between 0.5 and 30),
  delivery_fee_pkr          int     not null default 150  check (delivery_fee_pkr >= 0),

  -- Rain Mode (rule 9)
  rain_mode                 boolean not null default false,
  rain_extra_min            int     not null default 15   check (rain_extra_min between 0 and 120),

  -- Rider pay — never depends on lateness (rule 11)
  rider_base_pay_pkr        int     not null default 120  check (rider_base_pay_pkr >= 0),
  rider_per_km_pkr          int     not null default 20   check (rider_per_km_pkr >= 0),

  -- Rider GPS cadence
  location_broadcast_sec    int     not null default 5    check (location_broadcast_sec between 2 and 60),
  location_save_sec         int     not null default 30   check (location_save_sec between 5 and 600),

  -- Customer home
  on_time_score_min_deliveries int  not null default 50   check (on_time_score_min_deliveries >= 0),

  -- Dev tools (simulation + time warp). Must be false in production.
  dev_tools_enabled         boolean not null default false,
  warp_factor               numeric(6,2) not null default 1 check (warp_factor between 1 and 60),
  warp_real_anchor          timestamptz not null default now(),
  warp_app_anchor           timestamptz not null default now(),
  sim_running               boolean not null default false,

  updated_at                timestamptz not null default now(),
  updated_by                uuid
);

insert into public.app_settings (id) values (true);

create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- zones — delivery polygons, [[lat, lng], ...]
-- ---------------------------------------------------------------------------
create table public.zones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  polygon     jsonb not null check (jsonb_typeof(polygon) = 'array' and jsonb_array_length(polygon) >= 3),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger zones_updated_at before update on public.zones
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------
create table public.restaurants (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name            text not null,
  tagline         text not null default '',
  cuisines        text[] not null default '{}',
  cluster         text not null default '',          -- e.g. "Y Block, Phase 3"
  address         text not null default '',
  phone           text,
  lat             double precision not null check (lat between -90 and 90),
  lng             double precision not null check (lng between -180 and 180),
  radius_km       numeric(5,2) check (radius_km is null or radius_km between 0.5 and 30), -- null = default
  rating          numeric(2,1) not null default 4.5 check (rating between 0 and 5),
  rating_count    int not null default 0,
  price_level     int not null default 2 check (price_level between 1 and 4),
  hero_emoji      text not null default '🍽️',
  hero_from       text not null default '#F08A24',   -- placeholder gradient until photos arrive
  hero_to         text not null default '#7A2E0E',
  hero_image_url  text,
  opens_at        time not null default '11:00',     -- Asia/Karachi local time
  closes_at       time not null default '02:00',     -- may be after midnight; equal = 24h
  is_active       boolean not null default true,     -- listed on the app
  is_accepting    boolean not null default true,     -- restaurant's own open/closed switch
  paused_until    timestamptz,                       -- "Busy, back in X min"
  pause_reason    text,
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger restaurants_updated_at before update on public.restaurants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles — one per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  role           public.user_role not null default 'customer',
  full_name      text not null default '',
  phone          text,                                     -- E.164, e.g. +923001234567
  avatar_url     text,
  restaurant_id  uuid references public.restaurants (id) on delete set null,
  is_test        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint restaurant_staff_has_restaurant check (role <> 'restaurant' or restaurant_id is not null)
);

create unique index profiles_phone_key on public.profiles (phone) where phone is not null;
create index profiles_restaurant_idx on public.profiles (restaurant_id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- addresses — DHA-shaped: Phase → Block/Sector → House
-- ---------------------------------------------------------------------------
create table public.addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  label           text not null default 'Home' check (char_length(label) between 1 and 30),
  phase           text not null check (char_length(phase) between 1 and 40),
  block           text not null check (char_length(block) between 1 and 40),
  house_no        text not null check (char_length(house_no) between 1 and 40),
  street          text check (street is null or char_length(street) <= 80),
  lat             double precision not null check (lat between -90 and 90),
  lng             double precision not null check (lng between -180 and 180),
  gate_note_kind  text not null default 'call' check (gate_note_kind in ('guard', 'bell', 'call', 'custom')),
  gate_note       text check (gate_note is null or char_length(gate_note) <= 200),
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default on public.addresses (user_id) where is_default;

create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- menu
-- ---------------------------------------------------------------------------
create table public.menu_sections (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  name           text not null,
  sort           int not null default 0,
  created_at     timestamptz not null default now()
);

create index menu_sections_restaurant_idx on public.menu_sections (restaurant_id, sort);

-- option_groups: [{ id, name, min, max, options: [{ id, name, price_pkr }] }]
create table public.menu_items (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  section_id     uuid references public.menu_sections (id) on delete set null,
  name           text not null check (char_length(name) between 1 and 80),
  description    text not null default '',
  price_pkr      int not null check (price_pkr > 0),
  prep_min       int not null check (prep_min between 1 and 90),
  emoji          text not null default '🍽️',
  image_url      text,
  option_groups  jsonb not null default '[]' check (jsonb_typeof(option_groups) = 'array'),
  is_available   boolean not null default true,  -- out-of-stock toggle
  is_popular     boolean not null default false,
  is_active      boolean not null default true,  -- soft delete
  sort           int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index menu_items_restaurant_idx on public.menu_items (restaurant_id, sort);

create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- riders
-- ---------------------------------------------------------------------------
create table public.riders (
  id                uuid primary key references public.profiles (id) on delete cascade,
  vehicle           text not null default 'Bike',
  plate             text,
  status            public.rider_status not null default 'offline',
  current_order_id  uuid,                       -- FK added after orders
  last_lat          double precision,
  last_lng          double precision,
  last_accuracy_m   double precision,
  last_seen_at      timestamptz,                -- real time of last saved GPS fix
  is_active         boolean not null default true,
  is_test           boolean not null default false,
  job_rev           int not null default 0,     -- bumped on any change to the rider's job (realtime nudge)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger riders_updated_at before update on public.riders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create sequence public.order_code_seq start 1001;

create table public.orders (
  id                        uuid primary key default gen_random_uuid(),
  code                      text not null unique default ('WP-' || nextval('public.order_code_seq')::text),
  customer_id               uuid not null references public.profiles (id),
  restaurant_id             uuid not null references public.restaurants (id),
  rider_id                  uuid references public.riders (id) on delete set null,
  address_id                uuid references public.addresses (id) on delete set null,

  -- Snapshots (so history never changes when a menu/address does)
  drop_lat                  double precision not null,
  drop_lng                  double precision not null,
  drop_address              text not null,
  drop_gate_note            text,
  customer_name             text not null default '',
  customer_phone            text,
  customer_note             text check (customer_note is null or char_length(customer_note) <= 300),

  status                    public.order_status not null default 'placed',

  -- Money (PKR)
  items_subtotal_pkr        int not null check (items_subtotal_pkr > 0),
  delivery_fee_pkr          int not null check (delivery_fee_pkr >= 0),
  total_pkr                 int not null check (total_pkr = items_subtotal_pkr + delivery_fee_pkr),
  free_cap_pkr              int not null check (free_cap_pkr >= 0),
  free_amount_pkr           int not null default 0 check (free_amount_pkr >= 0),
  amount_to_collect_pkr     int not null check (amount_to_collect_pkr >= 0),
  payment_method            public.payment_method not null default 'cod',

  -- Guarantee
  guarantee_active          boolean not null,           -- false in Rain Mode
  guarantee_state           public.guarantee_state not null,
  window_min                int not null,
  placed_at                 timestamptz not null,       -- app time (DB)
  accept_by                 timestamptz not null,
  promised_by               timestamptz,                -- null when guarantee is off

  -- Prediction at order time
  predicted_eta_min         int not null,
  predicted_prep_min        int not null,
  predicted_rider_min       numeric(6,2) not null default 0,
  predicted_ride_min        numeric(6,2) not null,
  planned_delivery_min      numeric(6,2) not null,      -- ride + handoff (split-clock budget)
  distance_km               numeric(6,2) not null,
  settings_snapshot         jsonb not null default '{}',

  -- Kitchen
  committed_prep_min        int check (committed_prep_min is null or committed_prep_min between 1 and 90),
  ready_by                  timestamptz,
  sealed_bag_photo_url      text,

  -- Lifecycle timestamps (app time)
  accepted_at               timestamptz,
  ready_at                  timestamptz,
  rider_assigned_at         timestamptz,
  picked_up_at              timestamptz,
  arrived_at                timestamptz,
  delivered_at              timestamptz,
  rejected_at               timestamptz,
  cancelled_at              timestamptz,
  reject_reason             text,
  cancel_reason             text,
  cancelled_by              text,

  -- Arrival (rule 2)
  arrival_lat               double precision,
  arrival_lng               double precision,
  arrival_accuracy_m        double precision,
  arrival_distance_m        double precision,
  arrival_within_geofence   boolean,
  arrival_reason            text,
  arrival_flagged           boolean not null default false,
  arrival_reviewed_at       timestamptz,
  arrival_review_note       text,

  -- Outcome (rules 3 & 10)
  late_by_sec               int,
  late_cause                public.late_cause,
  kitchen_overrun_sec       int,
  delivery_overrun_sec      int,
  restaurant_charge_pkr     int not null default 0 check (restaurant_charge_pkr >= 0),
  outcome_finalized_at      timestamptz,

  -- Rider pay, fixed at assignment, never reduced (rule 11)
  rider_payout_pkr          int not null default 0 check (rider_payout_pkr >= 0),

  is_simulated              boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint free_within_cap check (free_amount_pkr <= least(total_pkr, free_cap_pkr)),
  constraint collect_matches check (amount_to_collect_pkr = total_pkr - free_amount_pkr),
  constraint promised_when_active check (guarantee_active = (promised_by is not null)),
  constraint arrival_needs_fence_or_reason check (
    arrived_at is null or coalesce(arrival_within_geofence, false) or arrival_reason is not null
  )
);

create index orders_customer_idx   on public.orders (customer_id, placed_at desc);
create index orders_restaurant_idx on public.orders (restaurant_id, placed_at desc);
create index orders_rider_idx      on public.orders (rider_id, placed_at desc);
create index orders_active_idx     on public.orders (status)
  where status in ('placed', 'accepted', 'ready', 'picked_up', 'arrived');
create index orders_placed_at_idx  on public.orders (placed_at);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.riders
  add constraint riders_current_order_fk
  foreign key (current_order_id) references public.orders (id) on delete set null;

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  menu_item_id    uuid references public.menu_items (id) on delete set null,
  name            text not null,
  emoji           text not null default '🍽️',
  unit_price_pkr  int not null check (unit_price_pkr > 0),      -- base + options
  qty             int not null check (qty between 1 and 50),
  options         jsonb not null default '[]',                   -- [{ group, option, price_pkr }]
  line_total_pkr  int not null check (line_total_pkr = unit_price_pkr * qty),
  prep_min        int not null
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- order_events — append-only audit log
-- ---------------------------------------------------------------------------
create table public.order_events (
  id           bigint generated always as identity primary key,
  order_id     uuid not null references public.orders (id) on delete cascade,
  kind         text not null,                  -- status | assigned | guarantee | photo | note | review
  from_status  public.order_status,
  to_status    public.order_status,
  actor_id     uuid,
  actor_role   text,                           -- customer | restaurant | rider | admin | system
  at           timestamptz not null,           -- app time
  real_at      timestamptz not null default now(),
  meta         jsonb not null default '{}'
);

create index order_events_order_idx on public.order_events (order_id, id);

-- ---------------------------------------------------------------------------
-- payments — one per order; COD today, providers later
-- ---------------------------------------------------------------------------
create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null unique references public.orders (id) on delete cascade,
  method                public.payment_method not null,
  status                public.payment_status not null default 'pending',
  amount_total_pkr      int not null check (amount_total_pkr >= 0),
  amount_waived_pkr     int not null default 0 check (amount_waived_pkr >= 0),
  amount_due_pkr        int not null check (amount_due_pkr >= 0),
  amount_collected_pkr  int check (amount_collected_pkr is null or amount_collected_pkr >= 0),
  collected_by          uuid references public.profiles (id),
  collected_at          timestamptz,
  provider              text,            -- e.g. 'jazzcash'
  provider_ref          text,            -- provider transaction id
  meta                  jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- order_transitions — the state machine's allowed edges
-- ---------------------------------------------------------------------------
create table public.order_transitions (
  from_status  public.order_status not null,
  to_status    public.order_status not null,
  roles        text[] not null,
  primary key (from_status, to_status)
);

insert into public.order_transitions (from_status, to_status, roles) values
  ('placed',    'accepted',  '{restaurant,admin}'),
  ('placed',    'rejected',  '{restaurant,admin}'),
  ('placed',    'cancelled', '{customer,system,admin}'),
  ('accepted',  'ready',     '{restaurant,admin}'),
  ('accepted',  'cancelled', '{admin}'),
  ('ready',     'picked_up', '{rider,admin}'),
  ('ready',     'cancelled', '{admin}'),
  ('picked_up', 'arrived',   '{rider,admin}'),
  ('picked_up', 'cancelled', '{admin}'),
  ('arrived',   'delivered', '{rider,admin}'),
  ('arrived',   'cancelled', '{admin}');
