# What to test (per milestone)

Before anything: `npm run dev`, open <http://localhost:3000>. Tip: open Chrome DevTools →
**Toggle device toolbar** (⌘⇧M / Ctrl⇧M) → pick an iPhone (390 px wide) to see the real mobile layout.

The **Dev** button (bottom-left) signs you in as any test account. "Put all test riders online"
gives the ETA engine riders to work with — **press it first**, otherwise every restaurant says
"All our riders are out".

---

## Milestone 1 — setup, schema, seed

1. `npm test` → **71 passed** (guarantee engine).
2. `npm run seed` → ✓ lines + the list of test logins.
3. Supabase dashboard → **Table Editor**: `restaurants` has 15 rows, `menu_items` ~190, `riders` 5.
4. Optional (needs `psql`): copy the **connection string** from Supabase → Connect → "Session pooler",
   then `DATABASE_URL="postgresql://…" npm run test:db` → `ALL DB INVARIANT TESTS PASSED`.

## Milestone 2 — customer flow

1. **Signed out:** the home page shows restaurants sorted by ETA from the DHA centre. Tap one — menu
   loads. Add an item → checkout says "Sign in to place your order".
2. **Dev → Customer "Hassan"** (Phase 3). Home now says *Bhook lagi hai, Hassan?* and ETAs are from his
   Y-Block address. Y-Block kitchens are fastest; Phase 6 ones are "too far" (> 4 km) — that's the
   radius rule working.
3. **Dev → "Put all test riders online"**, refresh. Every open kitchen gets a ⚡30 guaranteed badge.
4. Open **Degh & Dum** or **Chai Chowk** → tap an item → the bottom sheet: pick Half/Full, add-ons,
   quantity → **Add**. The cart bar bounces in. Try adding from a different restaurant → you're asked
   to start a new cart.
5. **View cart → Checkout:** address card, the dark **30-minute guarantee** card with the predicted
   ETA, items with +/−, bill (items + Rs 150 delivery, nothing else), Cash on delivery.
6. **Place order** → you land on the race screen with a mint ring counting down from 30:00 and
   "Kitchen has 1:59 to accept".
7. Leave it: after 2 minutes the order auto-cancels ("The kitchen didn't accept in time … not
   charged") — rule 7.
8. **Profile:** add a second address (Phase → Block → House → drag the pin → gate note), switch
   dark mode, sign out.
9. **Orders:** your cancelled order is listed; "Reorder" rebuilds the cart from today's menu.

Things that should refuse politely:
- Drop the address pin outside DHA → "We're DHA-only for now".
- Admin pauses a kitchen (milestone 6) / all riders offline → a specific reason + "try again in ~X min".
