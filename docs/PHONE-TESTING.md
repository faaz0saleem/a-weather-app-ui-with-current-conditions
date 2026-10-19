# Testing on your phone (riders need HTTPS for GPS)

Phones only share GPS with **https://** sites. `localhost` works on your computer, but your phone
can't reach it. Two free options:

## Option A — Cloudflare quick tunnel (free, no account, ~1 minute)

1. Make sure `.env.local` points at your **cloud** Supabase project (not a local one) and the app is
   running:

   ```bash
   npm run dev
   ```

2. Open a **second** Terminal window in the same folder and paste:

   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```

   After a few seconds it prints a line like
   `https://quiet-river-1234.trycloudflare.com` — that's your public HTTPS link.

3. On your phone, open that link in **Chrome** (Android) or **Safari** (iPhone).
4. Tap **Dev** → pick a rider (e.g. *Bilal Ahmed*) → **Go online** → allow location.
5. On your computer (normal `http://localhost:3000`), be the customer and the kitchen; the job pops up
   on the phone. Walk around — the customer's map moves every ~5 seconds.
6. Press `Ctrl + C` in the tunnel window to stop sharing. The link dies with it.

> The link changes every time you start the tunnel. It's public while it runs, so don't leave it on.

## Option B — the real thing on Hostinger

Once deployed (docs/DEPLOY-HOSTINGER.md), your site already has free HTTPS. Open
`https://your-domain/rider` on the phone.

## Testing "Arrived" without leaving your desk

- **Android Chrome:** Settings → About phone → tap *Build number* 7× → Developer options → *Select mock
  location app* (install any "Fake GPS" app), set the pin at the customer's house.
- **Desktop Chrome** (as a rider in a normal window): DevTools → ⋮ → More tools → **Sensors** →
  Location → *Other…* → type the drop coordinates (e.g. Hassan's `31.479, 74.386`). Move it 300 m away
  to see the "You're not at the pin" reason dialog (rule 2 — flagged for admin review).
- Or use the **Simulation** page in `/admin` (milestone 6) — a simulated rider drives the whole route.

## Install it like an app

- **Android:** Chrome ⋮ → *Add to Home screen* / *Install app*.
- **iPhone:** Safari Share → *Add to Home Screen*.
