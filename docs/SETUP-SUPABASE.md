# Setting up Supabase (≈ 15 minutes, free)

Do these once. Every step is either a click or a command to paste into **Terminal**
(Mac: ⌘-Space → type "Terminal" → Enter. Windows: Start → "PowerShell").

---

## 0. Install the tools (skip what you already have)

1. **Node.js 22 LTS** — download the installer from <https://nodejs.org> → click the big
   **"LTS"** button → run it → Next, Next, Finish.
2. **Git** — Mac: paste `xcode-select --install` into Terminal and press Enter.
   Windows: install from <https://git-scm.com/download/win>.
3. Check both worked:

   ```bash
   node -v && git --version
   ```

   You should see `v22.x.x` and a git version.

## 1. Get the code

```bash
git clone https://github.com/faaz0saleem/a-weather-app-ui-with-current-conditions.git waqtpe
cd waqtpe
git checkout app
npm install
```

(`app` is the branch with the WaqtPe app. The marketing site is on the `website` branch.)

## 2. Create the Supabase project

1. Go to <https://supabase.com> → **Start your project** → sign in with GitHub.
2. Click **New project**.
   - **Name:** `waqtpe`
   - **Database password:** click **Generate a password** → **copy it into your notes** (you need it
     in step 4).
   - **Region:** **South Asia (Mumbai)** — closest to Lahore.
   - **Plan:** Free.
3. Click **Create new project** and wait ~2 minutes until the dashboard loads.

## 3. Copy your keys into the app

1. In the Supabase dashboard click **Connect** (top of the page) → **App Frameworks** → copy
   the **Project URL** (looks like `https://abcdefgh.supabase.co`).
2. Left sidebar → **Project Settings** (gear) → **API Keys**.
   - Copy the **Publishable key** (`sb_publishable_…`).
   - Under **Secret keys**, click **Reveal** and copy the key (`sb_secret_…`).
     ⚠️ Never share the secret key or put it in a `NEXT_PUBLIC_` variable.
3. In Terminal (inside the `waqtpe` folder):

   ```bash
   cp .env.example .env.local
   ```

4. Open `.env.local` in any text editor (Mac: `open -e .env.local`) and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

   Leave the other lines as they are for now. Save.

## 4. Create the database tables

**Option A — Supabase CLI (recommended, one command each):**

```bash
npx supabase@latest login
```

(A browser opens → click **Authorize**.) Then find your **project ref** — it's the
`abcdefgh` part of your Project URL — and run:

```bash
npx supabase@latest link --project-ref abcdefgh
npx supabase@latest db push
```

When asked for the database password, paste the one you saved in step 2. Type `Y` to apply.

**Option B — no CLI:** Supabase dashboard → **SQL Editor** → **New query**. Open each file in
`supabase/migrations/` **in order** (001, 002, 003, 004), paste its contents, click **Run**,
and check it says *Success*.

## 5. Lock down sign-ups (security)

The app creates accounts on the server, so public sign-up through Supabase isn't needed.

1. Dashboard → **Authentication** → **Sign In / Providers**.
2. Make sure **Email** is **enabled**.
3. Turn **OFF** "**Allow new users to sign up**" → **Save**.

(Customers can still sign up in the app — the app's server creates their account.)

## 6. Load the test data

```bash
npm run seed
```

You'll see ✓ lines and a list of test logins (password `waqtpe123` unless you changed
`SEED_PASSWORD`). This creates the 15 restaurants, 5 riders, 3 customers and 1 admin.

## 7. Run it

```bash
npm run dev
```

Open <http://localhost:3000>. Use the **Dev** button (bottom-left) to switch between customer,
restaurant, rider and admin.

---

### Test logins (all use `SEED_PASSWORD`, default `waqtpe123`)

| Role | Phone |
|---|---|
| Admin | 0300 0000001 |
| Customers | 0300 0000101 (Hassan, Phase 3) · 0300 0000102 (Ayesha, Phase 5) · 0300 0000103 (Zara, Phase 6) |
| Riders | 0300 0000201 … 0300 0000205 |
| Restaurants | 0300 0000301 … 0300 0000315 (in the order of `supabase/seed/data.ts`) |

### Starting the real pilot

1. Replace the restaurants in `supabase/seed/data.ts` with the real ones → `npm run seed`.
2. Create real rider and restaurant logins from **/admin** (Riders / Restaurants pages).
3. Set `NEXT_PUBLIC_DEV_TOOLS=false` and in **/admin → Settings** turn **Dev tools** off.
4. `npm run seed -- --reset-orders` wipes all test orders (only while dev tools are still on).

### Troubleshooting

- **"Supabase is not configured"** → `.env.local` is missing a value; restart `npm run dev` after
  editing it.
- **Seed says "Invalid API key"** → you pasted the publishable key into `SUPABASE_SECRET_KEY`.
- **`db push` asks to reset** → answer `n`; you're pushing to an empty project so it shouldn't.
