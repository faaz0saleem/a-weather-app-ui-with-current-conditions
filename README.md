# WaqtPe — *30 minutes, or it's on us.*

Food delivery for **DHA Lahore** with a live 30-minute clock on every order. If we're late, it's free.
This branch (`app`) is the installable PWA with four areas:

| Area | URL | For |
|---|---|---|
| Customer | `/` | ordering + the live "race screen" |
| Restaurant | `/restaurant` | kitchen tablet: accept, cook, mark ready |
| Rider | `/rider` | phone: jobs, GPS, geofenced "Arrived", cash to collect |
| Admin | `/admin` | ops: live board, settings, analytics, simulation |

The public marketing site lives on the **`website`** branch.

## Quick start

```bash
npm install
cp .env.example .env.local      # then fill in your Supabase keys
npm run seed                    # 15 restaurants, riders, customers, admin
npm run dev                     # http://localhost:3000
```

First time? Follow **[docs/SETUP-SUPABASE.md](docs/SETUP-SUPABASE.md)** step by step.
Deploying? **[docs/DEPLOY-HOSTINGER.md](docs/DEPLOY-HOSTINGER.md)**.

## Docs

- **[SPEC.md](SPEC.md)** — the product spec, guarantee rules and the Decisions log.
- **[CLAUDE.md](CLAUDE.md)** — project conventions (and the non-negotiable guarantee rules).
- **[docs/TESTING.md](docs/TESTING.md)** — what to click to test each milestone.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` / `npm start` | Production build / server (honours `PORT`) |
| `npm run check` | Typecheck + lint + unit tests |
| `npm test` | Guarantee engine unit tests (Vitest) |
| `npm run test:db` | Database invariant tests (needs `DATABASE_URL`) |
| `npm run seed` | Load `supabase/seed/data.ts` into Supabase |
| `npm run db:push` | Apply `supabase/migrations` to the linked Supabase project |

## Brand

Name, tagline and colours: **`config/brand.ts`** (the only place). All UI copy: **`lib/i18n/en.ts`**.
