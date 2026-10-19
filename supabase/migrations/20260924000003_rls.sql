-- ============================================================================
-- WaqtPe · 003 · Row Level Security + grants
--
-- Principle: browsers READ through RLS (and Realtime, which applies the same
-- policies). Everything that matters is WRITTEN by the server with the service
-- role, after authenticating the user and running lib/guarantee.
-- Exceptions (safe, own-data only): addresses CRUD, profile name/avatar.
-- ============================================================================

alter table public.app_settings      enable row level security;
alter table public.zones             enable row level security;
alter table public.restaurants       enable row level security;
alter table public.profiles          enable row level security;
alter table public.addresses         enable row level security;
alter table public.menu_sections     enable row level security;
alter table public.menu_items        enable row level security;
alter table public.riders            enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.order_events      enable row level security;
alter table public.payments          enable row level security;
alter table public.order_transitions enable row level security;

-- ---------------------------------------------------------------------------
-- Public catalogue (readable by anyone, including signed-out browsers)
-- ---------------------------------------------------------------------------
create policy "settings are public"     on public.app_settings      for select using (true);
create policy "zones are public"        on public.zones             for select using (true);
create policy "restaurants are public"  on public.restaurants       for select using (true);
create policy "menu sections are public" on public.menu_sections    for select using (true);
create policy "menu items are public"   on public.menu_items        for select using (true);
create policy "transitions are public"  on public.order_transitions for select using (true);

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "read own profile (admin reads all)"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Column grants below limit this to full_name + avatar_url.
create policy "update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- addresses — customers manage their own
-- ---------------------------------------------------------------------------
create policy "read own addresses"
  on public.addresses for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "insert own addresses"
  on public.addresses for insert to authenticated
  with check (user_id = auth.uid());

create policy "update own addresses"
  on public.addresses for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete own addresses"
  on public.addresses for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- riders — a rider sees themself; a customer sees the rider on their live
-- order (for the map); admin sees all.
-- ---------------------------------------------------------------------------
create policy "rider self, customer's live rider, admin"
  on public.riders for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.orders o
       where o.rider_id = riders.id
         and o.customer_id = auth.uid()
         and o.status in ('accepted', 'ready', 'picked_up', 'arrived')
    )
  );

-- ---------------------------------------------------------------------------
-- orders — customer (own), restaurant staff (their kitchen), admin.
-- Riders deliberately have NO access: their jobs come from /api/rider/job,
-- which never includes the deadline (guarantee rule 11).
-- ---------------------------------------------------------------------------
create policy "orders: customer, kitchen, admin"
  on public.orders for select to authenticated
  using (
    customer_id = auth.uid()
    or restaurant_id = public.my_restaurant_id()
    or public.is_admin()
  );

-- Children inherit visibility from their order (the subquery runs under the
-- same RLS as the caller).
create policy "order items follow order"
  on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy "order events follow order"
  on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy "payments follow order"
  on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- ---------------------------------------------------------------------------
-- Grants. RLS decides *which rows*; grants decide *which operations*.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.app_settings, public.zones, public.restaurants,
                public.menu_sections, public.menu_items, public.order_transitions
  to anon, authenticated;

grant select on public.profiles, public.addresses, public.riders, public.orders,
                public.order_items, public.order_events, public.payments
  to authenticated;

grant insert, update, delete on public.addresses to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Functions: nothing is callable from the browser except the clock, the
-- public score, and the helpers RLS policies need.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

grant execute on function public.app_now()              to anon, authenticated;
grant execute on function public.server_clock()         to anon, authenticated;
grant execute on function public.public_on_time_score() to anon, authenticated;
grant execute on function public.my_role()              to authenticated;
grant execute on function public.is_admin()             to anon, authenticated;
grant execute on function public.my_restaurant_id()     to anon, authenticated;
