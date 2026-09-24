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

## Milestone 3 — restaurant dashboard

Best on a tablet or a laptop window ≥ 1024 px wide (it also works on a phone).

1. In one browser window: **Dev → Customer "Hassan"**, riders online, order from **Chai Chowk**.
2. In a second window (or incognito): **Dev → Restaurant "Chai Chowk Stall"** → `/restaurant`.
3. Tap **Start shift** → a chime plays; the new order alarm now rings every ~2.5 s and the screen
   stays awake. The **New order** card shows the 2-minute accept countdown (turns red under 30 s).
4. Pick a prep time (chips are capped so the kitchen can't over-promise) → **Accept**. The card moves
   to **Cooking** with a prep countdown; "Bilal Ahmed is coming" appears (nearest free rider was
   auto-assigned). The customer's race screen moves to *Cooking* instantly (realtime).
5. **Mark ready** → take a photo (on a laptop, pick any image) → **Upload & mark ready**. The
   customer sees the sealed-bag photo. "Camera not working?" marks ready without one (logged).
6. **Reject** another order with a reason → the customer sees "The kitchen couldn't take this one".
7. **Pause → 10 min** → customers see "Kitchen's slammed — back in ~10 min" on this restaurant.
   **Resume** clears it. The **Taking orders** switch closes the kitchen entirely.
8. **Menu** tab: toggle an item **Sold out** (it greys out for customers), edit a price, set prep to
   15 → it shows "hidden" (not fast-lane) and disappears from the customer menu. Upload a photo.
9. **Today** tab: orders, on-time %, lates caused by the kitchen, kitchen charges.
10. Admin can open any kitchen: **Dev → Admin** → `/restaurant`.

## Milestone 4 — rider app

Full phone instructions (HTTPS tunnel, fake GPS): **[PHONE-TESTING.md](PHONE-TESTING.md)**.

1. Place an order as a customer and accept + mark it ready as the kitchen (milestone 3).
2. **Dev → Rider** — the one named on the kitchen card ("Bilal Ahmed is coming"). `/rider` shows:
   **Collect Rs 450** in huge text, the pickup card ("Food is ready — pick it up"), the drop card with
   the gate note, *Open in Google Maps* and call buttons. **No timer, no deadline, no hurry** — by design.
3. **Picked up** → the customer's race screen moves to *On the way* and shows the rider on the map.
4. Set your location ~300 m from the customer (DevTools → Sensors) → **Arrived** → "You're not at the
   pin" → pick a reason → it goes through but is **flagged for admin review**.
   Set it within 75 m → **Arrived** goes straight through and the customer's clock stops.
5. **Delivered** → confirm the cash → back to "Looking for a job", today's earnings updated. Pay per
   job is fixed at assignment (base + per km) and never changes.
6. **Go offline** is blocked while you have a job.
