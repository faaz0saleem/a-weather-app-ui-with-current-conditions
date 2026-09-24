# WaqtPe — marketing website (`website` branch)

The public site for **WaqtPe — "30 minutes, or it's on us."** The ordering app itself lives on the
**`app`** branch. Name, tagline and colours: `config/brand.ts` (same file as the app — keep them in
sync). Site links (app URL, WhatsApp, email): `config/site.ts`.

Pages: `/` (landing + FAQ), `/restaurants/`, `/riders/`, `/privacy/`, `/terms/` (drafts — get them
reviewed by a lawyer before launch).

## Run it

```bash
npm install
npm run dev        # http://localhost:3001
npm run build      # static export → out/
npm start          # preview out/ on http://localhost:3000
```

## Deploy on Hostinger — pick ONE

### Option 1 · Any Hostinger plan (upload files)

1. On your computer: `npm install && npm run build` → creates the **`out`** folder.
2. hPanel → **Websites** → your domain (e.g. `waqtpe.pk`) → **File Manager** → open **public_html**.
3. Delete the default `default.php` / `index.php` if present.
4. **Upload** everything *inside* `out/` (not the folder itself) into `public_html` — including the
   hidden `.htaccess` file (it forces HTTPS and serves the 404 page).
5. hPanel → **Security → SSL** → make sure SSL is installed for the domain. Open `https://waqtpe.pk`.

To update: rebuild and upload again (overwrite).

### Option 2 · Node.js Web App (auto-deploys on every push)

1. hPanel → **Websites** → **Add Website** → **Node.js Apps** → **Import Git Repository**.
2. Authorize GitHub → repository `faaz0saleem/a-weather-app-ui-with-current-conditions` → branch
   **`website`**.
3. Framework: Next.js (auto-detected). Keep the suggested build settings.
4. Environment variable (optional): `NEXT_PUBLIC_APP_URL` = `https://app.waqtpe.pk` (where "Order now"
   goes).
5. **Deploy**, then connect your domain under the app's **Domains** settings.

## Where to change things

| Change | File |
|---|---|
| Name, tagline, colours | `config/brand.ts` |
| "Order now" link, WhatsApp, email, kitchen count, clusters | `config/site.ts` |
| Landing page copy + FAQ | `app/page.tsx` |
| Restaurant / rider pages | `app/restaurants/page.tsx`, `app/riders/page.tsx` |
