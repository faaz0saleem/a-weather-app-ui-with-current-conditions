# WaqtPe — Product Spec (MVP / DHA Lahore pilot)

> Working name **WaqtPe** · Tagline **"30 minutes, or it's on us."**
> Name, tagline and brand colours live in [`config/brand.ts`](config/brand.ts). Change them there only.

## 1. What we're building

A food-delivery app for **DHA Lahore only**, piloting with **15 restaurants**. The difference from
Foodpanda is a hard promise: every order carries a **live 30-minute clock**, and if we're late the
order is **free** (up to a cap). Everything else — design, speed, honesty — exists to make that
promise safe to keep.

One installable, mobile-first **PWA** with four areas:

| Area | Path | Device | Who |
|---|---|---|---|
| Customer | `/` | phone (designed at 390 px) | people ordering food |
| Restaurant | `/restaurant` | kitchen tablet | restaurant staff |
| Rider | `/rider` | rider's phone | delivery riders |
| Admin / ops | `/admin` | laptop | WaqtPe operations |

Two git branches (see Decisions): **`app`** (this Next.js PWA) and **`website`** (the public
marketing site). Both deploy to **Hostinger**.

## 2. The 30-minute guarantee (non-negotiable rules)

These rules are copied into `CLAUDE.md` and must never be weakened without the founder's sign-off.

1. **Clock start.** The clock starts when the customer taps *Place order*:
   `promised_by = placed_at + guarantee_window_min` (default 30). Both are set by the database
   (`app_now()`), never by a device.
2. **Clock stop.** The clock stops when the rider taps **Arrived** and their GPS is within
   `geofence_m` (default **75 m**) of the delivery pin. Waiting at the gate does not count against us.
   If GPS fails / is too far, the rider can still mark Arrived **with a reason** → the order is
   **flagged for admin review**.
3. **Free on late.** If the rider hasn't arrived by `promised_by`, the order is **free up to a cap**
   (`free_cap_pkr`, default **Rs 3,000**). For COD the rider collects **Rs 0**, or only the amount
   above the cap. The customer's screen flips to **"It's on us"** the second the deadline passes.
   Once free, an order can never become un-free.
4. **Server time only.** The UI syncs to server time (`/api/time`) for the countdown. The device clock
   is never trusted for anything that matters.
5. **Eligibility before we take the order.** A server-side check must pass *before* an order is
   created:
   - drop pin inside the **active DHA zone** polygon, and within the restaurant's radius
     (`restaurant_radius_km`, default 4 km, overridable per restaurant);
   - restaurant **open** (opening hours, Asia/Karachi), **accepting**, and **not paused**;
   - a rider **free now**, or **free within ~5 min** (`rider_soon_free_min`);
   - predicted **ETA ≤ `max_eta_min` (25)** — a 5-minute safety buffer under the 30-minute promise.
   If any check fails we don't take the order, and show a friendly, specific reason plus when to try
   again ("Kitchen's slammed, back in ~10 min").
6. **ETA v1** = `accept_buffer_min` (2) + **max**(prep time incl. queue penalty, time for the nearest
   free rider to reach the restaurant) + **ride time** (straight-line km × `route_factor` 1.35 at
   `rider_speed_kmh` 20) + `handoff_min` (3).
   Prep = slowest item in the cart + `queue_penalty_min` × orders already in that kitchen.
7. **Accept timeout.** Restaurants must accept within `accept_timeout_sec` (120 s) or the order
   auto-cancels. The customer is told instantly and is never charged.
8. **Fast lane only.** Only items with `prep_min ≤ fast_lane_max_prep_min` (12) can be sold, so every
   order can carry the guarantee. Slower items can exist in a menu but are hidden from customers and
   rejected by the server.
9. **Rain Mode** (admin switch). The guarantee pauses app-wide. Orders are still allowed but are
   clearly marked **"No timer right now"** with an honest longer ETA (`+ rain_extra_min`), shown
   **before checkout**. Rain-mode orders are never free and show no countdown.
10. **Split clock.** Each order stores the restaurant's **committed prep time** at accept. When an
    order is late we attribute the cause:
    - kitchen overrun = `ready_at − (accepted_at + committed_prep_min)`
    - delivery overrun = `(arrived_at − ready_at) − planned_delivery_min` (ride + handoff predicted at
      order time)
    - late cause = whichever overran more (ties and "neither overran" → delivery; the platform
      absorbs its own ETA misses).
    Kitchen-caused lates are **charged to the restaurant** (`kitchen_charge_pct`, default 100 % of the
    free amount). All of it is visible in admin.
11. **Rider safety.** Riders **never** see the customer's countdown or deadline; rider pay is **never**
    cut for lateness (pay = base + per-km, computed without any lateness input); there is **no
    "hurry" messaging** anywhere in the rider app.
12. **Everything is a setting.** Every number above lives in the admin-editable `app_settings` table.

### Guarantee states (`orders.guarantee_state`)

| State | Meaning |
|---|---|
| `active` | Clock running (placed, accepted, ready, picked up; before `promised_by`) |
| `on_time` | Rider arrived before `promised_by` |
| `free` | `promised_by` passed without arrival → free up to cap (irreversible) |
| `off` | Rain Mode order — no clock, never free |
| `void` | Rejected or cancelled before delivery — nothing charged |

### Timer colours (customer race screen)

mint (> 10 min left) → amber (≤ 10 min) → chili red (≤ 3 min) → **gold** (deadline passed = free).

## 3. Order lifecycle (database-enforced state machine)

```
placed ──► accepted ──► ready ──► picked_up ──► arrived ──► delivered
   │            │          │           │
   ├─► rejected │          │           │          (restaurant, with reason)
   └─► cancelled◄──────────┴───────────┘          (customer before accept, system timeout, admin)
```

| From → To | Who may do it |
|---|---|
| placed → accepted / rejected | restaurant staff of that restaurant, admin |
| placed → cancelled | the customer, system (accept timeout), admin |
| accepted → ready | restaurant staff, admin |
| ready → picked_up | the assigned rider, admin |
| picked_up → arrived | the assigned rider (geofence or reason), admin |
| arrived → delivered | the assigned rider, admin |
| accepted / ready / picked_up / arrived → cancelled | admin only |

- Enforced by the Postgres function `transition_order()` using the `order_transitions` table.
  A trigger blocks **any** status change that doesn't come through that function, so no client
  (or buggy server code) can skip a step.
- Every change is written to `order_events` with app time + real time, actor and metadata.
- `transition_order()` is executable only by the server (service role). Browsers call Next.js API
  routes, which authenticate the user, run guarantee logic, then call the function.

## 4. Architecture

- **Next.js 16 (App Router) + TypeScript**, Tailwind CSS v4, shadcn/ui (Radix), Motion, lucide-react.
- **Supabase**: Postgres (+ RLS on every table), Auth, Realtime, Storage. SQL migrations in
  `supabase/migrations`.
- **Guarantee logic** in `lib/guarantee/*` — pure functions, unit-tested with Vitest, imported only by
  server code (`server-only`), fed with **database time** (`app_now()`).
- **Background sweep** (`lib/server/sweep.ts`) runs every 5 s inside the Node server
  (`instrumentation.ts`) and on demand: auto-cancels unaccepted orders, flips late orders to free,
  finalises outcomes/attribution, assigns waiting orders to riders. A backup HTTP endpoint
  (`/api/cron/sweep`) can be hit by a Hostinger cron job or Supabase `pg_cron`+`pg_net`.
- **Maps**: Leaflet + OpenStreetMap tiles behind one component (`components/map/`) so we can switch to
  Google Maps later.
- **Payments**: Cash on Delivery only. `payments` table + `lib/payments` provider interface so
  JazzCash / Easypaisa / cards slot in later.
- **Realtime**: Postgres changes (RLS-filtered) for orders, riders, settings; Broadcast channels for
  rider GPS every ~5 s.
- **Time**: Asia/Karachi everywhere in the UI. Money is integer PKR, shown as `Rs 1,250`.
- **Hosting**: Hostinger (Node.js Web App on Business/Cloud plans, or a VPS with PM2). No
  Vercel-only features are used. See `docs/DEPLOY-HOSTINGER.md`.

### Time warp (dev only)

`app_now()` = real time, or when the admin enables time warp:
`warp_app_anchor + (now() − warp_real_anchor) × factor`. All guarantee logic and the client
countdown use app time, so a 10× warp lets you watch an order go late → free in ~3 real minutes.
Only possible while `app_settings.dev_tools_enabled` is true **and** the app runs with
`NEXT_PUBLIC_DEV_TOOLS=true`.

## 5. Data model (summary)

| Table | Purpose |
|---|---|
| `app_settings` | single row; every guarantee number, Rain Mode, rider pay, time warp |
| `zones` | delivery zone polygons (one active DHA zone) |
| `profiles` | one per auth user: role (`customer`/`restaurant`/`rider`/`admin`), name, phone, restaurant link |
| `addresses` | customer's saved DHA addresses: phase, block, house, pin, gate note |
| `restaurants` | location, radius, hours, pause, hero placeholder, rating |
| `menu_sections`, `menu_items` | menu; items carry `prep_min`, stock toggle, `option_groups` JSON |
| `riders` | rider status (offline/idle/busy), last GPS, current order |
| `orders` | the order + snapshots (address, prices, settings) + all guarantee fields |
| `order_items` | line items with chosen options, price snapshot |
| `order_events` | append-only audit log of every change |
| `payments` | one per order; method, amount due/waived/collected, provider refs |
| `order_transitions` | the allowed state-machine edges and who may take them |

RLS summary: customers see their own profile/addresses/orders; restaurant staff see their
restaurant's orders and menu; riders see only their own rider row (jobs come through a sanitised API
that never includes the deadline); admins see everything. Menus/restaurants/zones/settings are
publicly readable. All writes that matter go through the server.

## 6. Customer app (`/`)

- **Login**: +92 phone number + password (MVP), sign up with name. Dev-only role switcher.
- **Address picker** built for DHA: Phase → Block/Sector → House no. → drag the map pin to confirm →
  gate note chips ("Guard will receive", "Ring the bell", "Call on arrival") + free text. Multiple
  saved addresses, one default.
- **Home**: "Bhook lagi hai?" greeting, on-time score card (this week's average delivery time and
  % on time, **hidden until 50+ deliveries**), cuisine chips, restaurants **sorted by fastest to you**
  with live ETA and a **⚡30 guaranteed** badge (or the reason it can't take orders right now). Rain
  Mode banner when active. No wall of promo banners.
- **Restaurant page**: big hero, rating, prep time, ETA to you, menu sections, item bottom sheet
  with options/add-ons, sticky cart bar.
- **Checkout**: items, delivery fee, total — no hidden fees. Guarantee status shown **before**
  placing (⚡ guaranteed / no-timer Rain Mode / can't order + reason). COD only.
- **Race screen** (`/orders/[id]`): big countdown ring, stages Placed → Cooking → On the way → At your
  gate, rider name/photo + call, live rider on map, sealed-bag photo. Late → full-screen gold
  "It's on us 🎉" celebration + shareable image card (next/og) for WhatsApp/Instagram.
- **Orders**: history, one-tap reorder, "saved from late orders" total.
- **Profile**: addresses, light/dark mode, sign out. All UI strings in `lib/i18n/` (Urdu later).

## 7. Restaurant dashboard (`/restaurant`)

- **Start shift**: unlocks audio + requests Wake Lock (screen stays on).
- New order → loud repeating alert + big card with the **2-minute accept countdown**; accept (confirm
  committed prep minutes) or reject with a reason.
- Per-order **prep countdown** vs committed prep. **Mark ready** asks for a sealed-bag photo
  (uploaded to Storage).
- **Menu**: items, photos, prices, prep minutes (fast-lane indicator), out-of-stock toggle.
- **Pause**: "Busy, back in X min".
- **Today**: orders, on-time %, lates caused by the kitchen, kitchen charges.

## 8. Rider app (`/rider`)

- Go online/offline. While online: GPS broadcast every ~5 s over Realtime, saved every ~30 s, Wake
  Lock on.
- Jobs auto-assigned to the **nearest free rider** when the restaurant accepts (admin can reassign).
- Job card: pickup → drop, Open in Google Maps, gate note, call restaurant/customer,
  **"Collect Rs X"** in huge text (Rs 0 for free orders).
- Buttons: Picked up → Arrived (geofence-checked, reason fallback) → Delivered.
- Today's earnings and jobs. No countdowns, no deadlines, no hurry.

## 9. Admin (`/admin`)

- **Live board**: every active order with its clock; predicted-late orders highlighted; unassigned
  orders flagged; manual (re)assign.
- **Settings**: every number, Rain Mode switch, delivery zone polygon editor, dev tools toggle.
- **Restaurants**: create/edit, pause, menu management, staff logins.
- **Riders**: create/edit/deactivate, live status.
- **Reviews**: arrivals flagged for GPS problems.
- **Analytics**: orders, average delivery time, on-time %, cost of free orders, lates by cause, by
  restaurant, by hour (Asia/Karachi).
- **Simulation** (dev only): spawn test orders, simulated riders moving along the route, auto
  kitchen, 10× time warp, clean-up.

## 10. Design

Premium, warm, fast. Mobile-first (390 px), one-thumb (bottom nav, bottom sheets). Palette: deep
ink/charcoal, warm cream, **saffron orange** brand; timer mint → amber → chili red → gold. **No pink.**
Bricolage Grotesque (headings) + Plus Jakarta Sans (body), big tabular numerals for timers. Light +
dark mode, purposeful motion (add to cart, order accepted, free celebration), skeleton loaders,
haptics (`navigator.vibrate`), a subtle Lahore truck-art pattern used sparingly (empty states,
celebration). Roman Urdu + English microcopy. Gradient + emoji placeholders until real photos.

## 11. Later (not built, not designed out)

Scheduled orders with exact-time promise ("Iftar on the dot") — `orders` has room for a
`scheduled_for`; JazzCash/Easypaisa — `payments.method` enum + provider interface; Urdu UI —
`lib/i18n`; group orders; free-delivery subscription; tracking-screen mini-game; Play Store wrapper
(TWA around the PWA); real SMS OTP — auth layer isolated in `lib/auth`.

## 12. Milestones

1. Setup, SPEC.md, CLAUDE.md, Supabase setup guide, schema + RLS + seed.
2. Customer flow: browse → restaurant → cart → checkout (eligibility) → order placed.
3. Restaurant dashboard with realtime orders.
4. Rider app: live location, geofenced Arrived, cash to collect; phone testing over HTTPS.
5. Race screen, guarantee engine, free-on-late, celebration + share card, tests.
6. Admin panel, analytics, simulation tools.
7. Polish: design, PWA install, performance, accessibility, empty/error states.
8. Deploy to Hostinger — walkthrough. (Plus the `website` branch.)

## 13. Decisions

Small calls made without asking. Change any of them by telling Claude.

| # | Decision | Why |
|---|---|---|
| D1 | **Two branches**: `app` = the Next.js PWA (all four areas), `website` = public marketing site (static export, deploys on any Hostinger plan). | Founder asked for "one website, one app" branches; each deploys independently on Hostinger from its own branch. |
| D2 | **Hostinger instead of Vercel.** Plain `next build` + `next start` (honours `PORT`), Node ≥ 20.9, no Vercel-only APIs. Background jobs run in-process via `instrumentation.ts`, with an HTTP cron fallback. | Founder is hosting on Hostinger. A long-running Node process makes a 5-second sweep trivial. |
| D3 | **Auth for MVP = phone number + password.** The phone is turned into an internal email (`923001234567@<domain>`) for Supabase email/password auth; the real `+92` phone is stored on the profile. Accounts are created server-side (admin API) so no confirmation email is ever sent. | Works on Supabase's free tier with zero SMS provider setup. Real OTP later = swap `lib/auth` to `signInWithOtp({ phone })` once an SMS provider is paid for (needs founder approval). |
| D4 | **Dev role switcher** shows only when `NEXT_PUBLIC_DEV_TOOLS=true`; it signs in seeded test accounts server-side (password never sent to the browser). | Test all four roles on one machine. Must be off in production. |
| D5 | **Status changes only via server** (`transition_order` is service-role-only) + a trigger that blocks direct status edits. | Guarantee logic must run on the server with DB time; the DB guarantees the state machine. |
| D6 | **Riders cannot read `orders`** at all under RLS; jobs come from `/api/rider/job`, which strips deadline/guarantee fields. Rider realtime = their own `riders` row (`job_rev` bump). | Rule 11: riders never see the countdown — enforced by data access, not just UI. |
| D7 | Amount to collect on a free order is shown to the rider as "Rs 0 · paid by WaqtPe" — no mention of lateness. | Rider needs the amount; lateness wording would create pressure. |
| D8 | **Late with no measurable overrun** (e.g. our ETA was wrong) is attributed to **delivery** (platform), never to the kitchen. Ties → delivery. | Restaurants are only charged when their own prep clearly overran. |
| D9 | **Queue penalty** = 2 min per order already accepted-but-not-ready in that kitchen (setting). | Simple, tunable proxy for kitchen load. |
| D10 | **"Rider free within ~5 min"** = busy rider who has arrived at a drop (≈ handoff left) or is on the way with ≤ 5 min ride left. Their time-to-restaurant includes finishing the current drop. | Matches brief; uses only data we have. |
| D11 | **Rider pay** = `rider_base_pay_pkr` (Rs 120) + `rider_per_km_pkr` (Rs 20) × road km, fixed at assignment, never reduced. | Rule 11. Settings-editable. |
| D12 | **Sealed-bag photo**: requested on "Mark ready"; a small "camera not working" link allows skipping, which is logged in `order_events`. | Real kitchens have broken cameras; we'd rather log than block food. |
| D13 | **Menu options** stored as JSON (`option_groups`) on each item: groups with min/max and priced choices (Half/Full, Extra raita). Prices are always recomputed on the server. | Fewer tables, easy to edit, validated with zod. |
| D14 | **Rider GPS broadcast** uses public Realtime Broadcast channels named with unguessable UUIDs (`rider:<uuid>`, `fleet`). Positions are also saved to the DB every 30 s. | Fastest to ship. Hardening later: Realtime private channels + RLS on `realtime.messages`. |
| D15 | **Time warp** is global (affects every order) and dev-only. Turning it off snaps app time back to real time — clean up warped test orders first (button in Simulation). | Simple and deterministic. |
| D16 | **One rider = one active job** in the MVP (no batching). | Keeps the guarantee honest; batching later. |
| D17 | **Customer can cancel only while `placed`** (before the restaurant accepts). After that, only admin can cancel. | Protects kitchens from wasted food. |
| D18 | **Browsing without login** is allowed (default pin = DHA Phase 5 centre for ETAs); login required at checkout. Cart is kept in `localStorage`, one restaurant per cart. | Lower friction; matches how people actually open food apps. |
| D19 | **On-time score** = last 7 days, non-simulated orders that reached `arrived`; hidden until `on_time_score_min_deliveries` (50). | Brief: real data only. |
| D20 | **shadcn/ui components are vendored** in `components/ui` in shadcn's format (Radix-based). | The shadcn registry was unreachable from the build sandbox; `npx shadcn add` still works on your machine. |
| D21 | **Map tiles**: OpenStreetMap standard tiles (dark mode via CSS filter). Fine for a pilot; switch to a paid/self-hosted tile provider or Google Maps before scaling (needs founder approval — paid). | Free, no key. |
| D22 | **Accept deadline** is enforced in three places: the DB refuses `accepted` after `accept_by`; the sweep auto-cancels; the dashboard counts down. | Belt and braces. |
| D23 | **Share card** is 1080×1350 PNG (Instagram portrait, fine on WhatsApp) at `/api/share/[orderId]`, no customer PII on it. | Shareable, safe. |
| D24 | Delivery **radius per restaurant** can override the default 4 km (`restaurants.radius_km`, null = default). | Some kitchens will want tighter radii. |
| D25 | **Rider over-booking guard**: when quoting, orders already waiting for a rider "reserve" one each, so the k-th waiting order is quoted against the (k+1)-th nearest free rider. | Stops 10 simultaneous orders all being promised the same single rider. |
| D26 | **Committed prep is capped** at the order's predicted prep (items + queue) or the fast-lane limit, whichever is higher. | Otherwise a kitchen could commit 25 min, never be "late", and push every late onto delivery (rule 10 loophole). |
| D27 | **Theme switching** uses a tiny inline `<head>` script + hook (`components/providers/theme*`) instead of next-themes. | next-themes injects a client-side `<script>` that React 19 warns about; the inline server script is the pattern Next 16 recommends and avoids any light/dark flash. |
