@AGENTS.md

# WaqtPe website — conventions

Static marketing site (Next.js 16, `output: "export"`, Tailwind v4). No server code, no secrets.
- Brand: `config/brand.ts` is a copy of the app's — keep them identical. Site links: `config/site.ts`.
- Everything must work as plain static files (Hostinger shared hosting). No API routes, no runtime
  data, no `next/image` optimisation (unoptimized).
- Every claim about the guarantee must match the app's rules (SPEC.md on the `app` branch):
  30-minute window from Place order, stops at Arrived within 75 m, free up to Rs 3,000, Rain Mode pauses
  it, riders never see the countdown and their pay is never cut.
- `npm run build` must pass; `npm run lint` clean.
