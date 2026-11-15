# Getting WaqtPe found on Google

What the site already does, and the steps only you can do. Work through "Before launch" in order.

## Already built into the site

- A page for each search people make: the home page, the 30-minute guarantee (`/guarantee/`),
  delivery areas (`/food-delivery/`), one page each for DHA Phase 6, 7 and 8, questions (`/faq/`),
  restaurants and riders.
- A title and description written for each page, and a canonical address so Google never sees duplicates.
- Structured data (the labels Google and AI assistants read): organisation, service area, questions
  and answers, breadcrumbs.
- `sitemap.xml`, `robots.txt` and `llms.txt` (a plain summary for AI assistants), all generated from
  `config/` so they stay in step with the pages.
- Fast static pages with self-hosted fonts; nothing loads from Google or any third party.

## Before launch (you)

1. **Domain.** The site assumes `waqtpe.pk`. If you buy a different one, change `websiteUrl` in
   `config/brand.ts` and rebuild. Every link, sitemap entry and label follows.
2. **Real contact details.** `supportPhone` in `config/brand.ts` is still the placeholder
   `+92 300 0000000`, and `config/site.ts` uses `hello@waqtpe.pk`. Every WhatsApp button on the site
   uses that number, so replace it before anyone sees the site.
3. **Google Search Console** (free, search.google.com/search-console). Add the domain, choose the
   "HTML tag" method, copy the code inside `content="..."` and set it as
   `NEXT_PUBLIC_GOOGLE_VERIFICATION` when building. Then submit `https://waqtpe.pk/sitemap.xml`.
4. **Bing Webmaster Tools** (free). Import from Search Console in one click. Bing also feeds several
   AI assistants.
5. **Google Business Profile** (free, business.google.com). This is what puts you on Google Maps and
   in "food delivery near me" results, and it matters more than anything on the website. Choose
   "service-area business", set the area to DHA Phase 6, 7 and 8, add the website and WhatsApp number.
6. **Legal pages.** `/privacy/` and `/terms/` carry a "draft" notice. Have a lawyer review them, then
   remove the notice in `components/legal.tsx`.

## On launch day

- Build with `NEXT_PUBLIC_LAUNCHED=true`. The site switches from "Launching soon" and the WhatsApp
  launch alert to "Now delivering" and "Order now".
- In Search Console, use "URL inspection" then "Request indexing" on the home page.

## After launch (what moves rankings)

- **Reviews** on the Google Business Profile. Ask every happy customer; reply to every review.
- **Links from local sites**: Lahore food bloggers, DHA community pages, partner restaurants linking
  to you from their own pages and Instagram bios.
- **Same name, phone and area everywhere** (Instagram, Facebook, TikTok, the profile, this site).
- **New phases.** When you expand, add the phase to `config/areas.ts`. Its page, sitemap entry and
  footer link appear on the next build.
- Expect weeks, not days. A new domain usually takes a few weeks to show up for its own name and a
  few months for searches like "food delivery DHA Phase 6".

## Keep it honest

Don't name a restaurant on the site until it has signed up, and keep every number on the site the same
as the app's settings (30 minutes, Rs 3,000 cap, 75 m, 10-minute fast lane). They live in
`config/site.ts`.
