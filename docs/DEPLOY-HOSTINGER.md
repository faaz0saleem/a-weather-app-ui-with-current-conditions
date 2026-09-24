# Deploying WaqtPe on Hostinger

Two branches, two deployments:

| Branch | What | Hostinger product | Example address |
|---|---|---|---|
| `app` | The WaqtPe app (customer, kitchen, rider, admin) | **Node.js Web App** (Business or Cloud plan) — or a VPS | `app.waqtpe.pk` |
| `website` | Marketing site | Node.js Web App **or** plain web hosting (any plan) | `waqtpe.pk` |

> Before you start: finish **[SETUP-SUPABASE.md](SETUP-SUPABASE.md)** (your Supabase project, tables and
> keys). Hostinger only runs the app; the data lives in Supabase.

---

## A. The app on Hostinger Node.js Web Apps (recommended)

Hostinger builds straight from GitHub and redeploys every time you push. It builds Next.js in
"standalone" mode automatically — the app is already set up for that (share-card fonts are bundled, the
guarantee sweep starts with the server). This was tested locally by building exactly that way.

### 1. Create the app

1. Log in to **hPanel** → left sidebar **Websites** → **Add Website**.
2. Choose **Node.js Apps** → **Import Git Repository**.
3. Click **Authorize** and allow Hostinger to access your GitHub.
4. Pick the repository **`faaz0saleem/a-weather-app-ui-with-current-conditions`** and the branch **`app`**.
5. Hostinger detects **Next.js** and pre-fills the settings. Check they say:
   - **Node.js version:** 22 (20 also works)
   - **Build command:** `npm run build` · **Output directory:** `.next`
   - Leave the install / entry / start settings as Hostinger suggests.

### 2. Environment variables (do this BEFORE the first deploy)

`NEXT_PUBLIC_…` values are baked in when Hostinger builds, so set them first. In the same screen
(**Environment variables** → **Add**), add each line — values from your `.env.local` / Supabase:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` (secret — never share) |
| `NEXT_PUBLIC_APP_URL` | `https://app.waqtpe.pk` (your final address, no trailing slash) |
| `NEXT_PUBLIC_DEV_TOOLS` | `true` while you test with fake orders, **`false` for the real pilot** |
| `PHONE_LOGIN_DOMAIN` | `phone.waqtpe.app` (keep the same value forever — logins depend on it) |
| `SEED_PASSWORD` | the test-account password (only used by the Dev switcher) |
| `CRON_SECRET` | a long random string (e.g. run `openssl rand -hex 24` in Terminal and paste the result) |
| `SWEEP_INTERVAL_MS` | `5000` |

### 3. Deploy

Click **Deploy**. The build log takes ~2–4 minutes. When it says it's running, open the temporary
address Hostinger shows you. You should see the WaqtPe home screen.

Quick checks:
- `https://YOUR-ADDRESS/api/time` shows `{"now":…,"warp":1}` → the server can reach Supabase.
- Sign in with the **Dev** button (if dev tools are on) and place a test order.

### 4. Your own domain + HTTPS

1. hPanel → your Node.js app → **Domains** (or **Connect domain**) → add `app.waqtpe.pk`.
2. If the domain is registered elsewhere, add the DNS record Hostinger shows you (usually a `CNAME` or
   `A` record) at your registrar.
3. SSL is free and automatic — wait until the padlock shows (can take up to an hour after DNS).
4. Update `NEXT_PUBLIC_APP_URL` to the new address → **Save** (Hostinger redeploys).

Riders need this HTTPS address for GPS — open `https://app.waqtpe.pk/rider` on their phones and
**Add to Home Screen**.

### 5. Backup timer for the guarantee (free, 2 minutes)

The server already checks every order every 5 seconds (auto-cancel after 2 min, flip to free at the
deadline), and pages re-check on every visit. For belt and braces — e.g. if Hostinger restarts the app —
let **Supabase** ping the app every 30 seconds:

Supabase dashboard → **Database → Extensions** → enable **pg_cron** and **pg_net**. Then **SQL Editor →
New query**, paste (replace the address and secret) → **Run**:

```sql
select cron.schedule(
  'waqtpe-sweep',
  '30 seconds',
  $$ select net.http_get(url := 'https://app.waqtpe.pk/api/cron/sweep?key=YOUR_CRON_SECRET') $$
);
```

To stop it later: `select cron.unschedule('waqtpe-sweep');`

### 6. Updating the app

Every `git push` to the `app` branch redeploys automatically. Database changes (new files in
`supabase/migrations`) are applied separately: `npx supabase@latest db push` (see SETUP-SUPABASE.md).

### 7. Going live with real customers — checklist

1. Clear test orders first: **Admin → Simulation → Clean up** (test orders) or, from your computer,
   `npm run seed -- --reset-orders` (all orders).
2. **Admin → Settings → Dev tools: OFF**, and set `NEXT_PUBLIC_DEV_TOOLS=false` in Hostinger → Save
   (redeploys; the Dev button and Simulation page disappear).
3. Replace the 15 fictional restaurants in `supabase/seed/data.ts` → `npm run seed`, or create them in
   **Admin → Restaurants**. Create real kitchen logins, and rider logins in **Admin → Riders**.
4. Test accounts (phones `+92300000…`) still sign in with `SEED_PASSWORD`. Deactivate test riders in
   Admin → Riders, or delete test users in Supabase → Authentication → Users.
5. Check **Admin → Settings** (window 30, cap Rs 3,000, geofence 75 m, fee Rs 150 …) and that
   **Rain Mode is OFF**. Check **Admin → Zone** matches the area you actually serve.

### Troubleshooting

- **Build fails with "Supabase is not configured"** → an environment variable is missing or misspelled.
  Fix it in Hostinger → Save → it rebuilds.
- **Pages error / "Database not ready"** → `SUPABASE_SECRET_KEY` is wrong (you pasted the publishable
  key), or the migrations weren't applied.
- **Changed a `NEXT_PUBLIC_…` value and nothing changed** → it's baked in at build time; Save again to
  trigger a rebuild.
- **Riders see "Location needs HTTPS"** → they opened `http://`; use the `https://` address.
- **Map tiles slow/blank** → OpenStreetMap tiles are free but rate-limited; fine for the pilot. At scale,
  switch the tile URL in `components/map/leaflet-map.tsx` (paid providers need your approval).

---

## B. Alternative: Hostinger VPS (KVM) with PM2

Use this if you'd rather run your own server.

```bash
# on the VPS (Ubuntu 24.04), as a sudo user
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs nginx git
sudo npm i -g pm2
git clone https://github.com/faaz0saleem/a-weather-app-ui-with-current-conditions.git waqtpe && cd waqtpe && git checkout app
cp .env.example .env.local && nano .env.local        # paste your real values, NEXT_PUBLIC_DEV_TOOLS=false
npm ci && npm run build
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup   # then run the command pm2 prints
```

Nginx (`/etc/nginx/sites-available/waqtpe`):

```nginx
server {
  server_name app.waqtpe.pk;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/waqtpe /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d app.waqtpe.pk
```

Update later: `git pull && npm ci && npm run build && pm2 reload waqtpe`.

---

## C. The marketing website (`website` branch)

See the README on the `website` branch. In short: either import that branch as a second **Node.js App**
(same clicks as A — only `NEXT_PUBLIC_APP_URL` is needed), or run `npm run build` on your computer and
upload the `out/` folder into **public_html** with Hostinger's File Manager — that works on every
Hostinger plan, even the cheapest.
