@AGENTS.md

# WaqtPe — project conventions

Food delivery for DHA Lahore with a 30-minute "or it's free" guarantee. Full product spec:
[SPEC.md](SPEC.md). Decisions log lives at the bottom of SPEC.md — add to it whenever you make a
product call.

## ⚠️ The guarantee rules — NON-NEGOTIABLE

Never weaken, bypass, or "temporarily" disable any of these. If a task seems to require it, stop and
ask the founder.

1. Clock starts at *Place order*: `promised_by = placed_at + window` (default 30 min), set by the DB.
2. Clock stops only when the rider taps **Arrived** within the geofence (default 75 m) of the pin.
   GPS failure → Arrived with a reason → flagged for admin review.
3. Not arrived by `promised_by` → order is **free up to the cap** (default Rs 3,000). COD collects
   Rs 0 (or only the amount above the cap). Customer screen flips to "It's on us" at the deadline.
   Free is irreversible.
4. Never trust the device clock. Guarantee decisions use DB time (`app_now()`); UI countdowns sync to
   `/api/time`.
5. Server-side eligibility before an order is taken: in the active zone + within restaurant radius;
   restaurant open, accepting, not paused; a rider free now or within ~5 min; predicted ETA ≤ 25 min.
   Otherwise refuse with a friendly, specific reason and a retry time.
6. ETA v1 = accept buffer (2) + max(prep incl. queue penalty, nearest free rider → restaurant)
   + ride (straight-line × 1.35 at 20 km/h) + handoff (3).
7. Restaurant must accept within 2 minutes or the order auto-cancels (customer told, never charged).
8. Only fast-lane items (prep ≤ 12 min) can be sold.
9. Rain Mode pauses the guarantee app-wide; orders allowed, marked "no timer right now" with an
   honest longer ETA shown before checkout.
10. Split clock: store committed prep at accept; attribute lates to kitchen vs delivery (bigger
    overrun wins; ties/unknown → delivery). Kitchen lates are charged to the restaurant.
11. **Rider safety:** riders never see the customer's countdown or deadline, their pay is never cut for
    lateness, and there is no "hurry" messaging anywhere in the rider app.
12. Every number lives in the admin-editable `app_settings` table — no magic numbers in code
    (defaults in `lib/guarantee/settings.ts` mirror the DB defaults only as a fallback for tests).

## Where things live

| What | Where |
|---|---|
| Brand name, tagline, colours | `config/brand.ts` (only place) |
| Every UI string | `lib/i18n/en.ts` (add `ur.ts` later) — no hard-coded copy in components |
| Guarantee logic (pure, tested) | `lib/guarantee/*` + `lib/guarantee/*.test.ts` |
| Server-only data access | `lib/server/*` (service-role client, sweep, orders, riders) |
| Supabase clients | `lib/supabase/{browser,server,service}.ts` |
| Money / time formatting | `lib/format.ts` (`formatPKR` → "Rs 1,250", Asia/Karachi) |
| Map (swap provider here) | `components/map/*` |
| Payment providers | `lib/payments/*` (COD today) |
| DB schema | `supabase/migrations/*.sql` — never edit an applied migration; add a new one |
| Seed data (easy to edit) | `supabase/seed/data.ts`, run with `npm run seed` |

## Rules of the road

- **Next.js 16**: read `node_modules/next/dist/docs/` before using an API you haven't used here.
  `proxy.ts` (not middleware), async `params`/`searchParams`/`cookies()`.
- **Status changes** only via `transition_order()` (called from server routes with the service
  client). Never `update orders set status = ...` — a trigger will reject it anyway.
- **RLS on every table.** New table ⇒ enable RLS + policies in the same migration.
- API routes authenticate with `requireUser()/requireRole()` from `lib/server/auth.ts`, validate input
  with zod, and return `{ error: { code, message } }` on failure.
- Money is integer PKR everywhere (`*_pkr` columns). Never floats for money.
- Times stored as `timestamptz` (UTC); displayed in Asia/Karachi.
- Rider-facing code (`app/rider/**`, `/api/rider/**`) must never read or return `promised_by`,
  `guarantee_state`, `late_*`, or countdown data. There's a test for the job serializer.
- Mobile-first at 390 px; min tap target 44 px; bottom sheets over modals on phones.
- Colours via CSS variables/Tailwind tokens (`bg-brand`, `text-ink`, `bg-timer-mint` …) — no raw hex
  in components. **No pink.**
- Motion: purposeful only; respect `prefers-reduced-motion`.
- No paid services without asking the founder.

## Commands

```bash
npm run dev          # local dev on http://localhost:3000
npm run build        # production build (also type-checks)
npm start            # production server (honours $PORT) — what Hostinger runs
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest (guarantee engine etc.)
npm run seed         # load supabase/seed/data.ts into the Supabase project in .env.local
npm run db:push      # apply migrations to the linked Supabase project (Supabase CLI)
```

After each milestone: run the app, fix every error + type/lint issue, `npm test`, commit.
