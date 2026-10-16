# Edge Ecosystem - Company Website (GitHub Pages)

This repository hosts the public website for **Edge Ecosystem** (high-tech landing + multi-language SEO).

- Live (custom domain): https://YOURDOMAIN/
- Fallback (GitHub Pages): https://edge-ivaikin-group.github.io/

## What’s inside

- `/` - English (default)
- `/ru/` - Russian
- `/ru/automation-ai/` - permanent Russian automation/AI page with contact handoff and short PDF
- `/ru/insights/team-rhythm/` - practical article and copyable team-agreement template, linked to the diagnostic service
- `/zh/` - Chinese (Simplified)
- `/ar/` - Arabic (RTL)
- `/deck/` - HTML capabilities deck (keyboard: ← →)
- `/EdgeEcosystem_Capabilities_Deck_EN.pdf` - PDF deck (EN)
- `/sitemap.xml` + `/robots.txt` - SEO basics
- `/assets/` - CSS/JS and static assets

## Quick start (local)

The team-rhythm article reuses Timothy Ivaikin's [authored short published on 30 September 2026](https://www.youtube.com/shorts/nGt7rlPl9hM), the existing automation page's visual style, portrait and service description. Its questions, fictional CRM handoff example and agreement template are new editorial material, clearly separated from the quoted video. The article adds no client-performance or corporate-history claims and supersedes no existing page. No new analytics or third-party requests on load are introduced.

Open `index.html` in a browser. No build step.

## Deploy (GitHub Pages)

1) GitHub repo: **Settings → Pages**
2) Source: **Deploy from a branch**
3) Branch: `main` (or `master`) / Folder: `/ (root)`
4) Verify site is reachable:
   - https://edge-ivaikin-group.github.io/

## Attach custom domain (canonical)

1) GitHub: **Settings → Pages → Custom domain** → set `YOURDOMAIN` (apex, no www)
2) DNS (registrar):
   - Add GitHub Pages A records for the apex domain
   - (Optional) `www` CNAME → `edge-ivaikin-group.github.io`
   - Add redirect `www → apex` at the registrar/CDN level
3) After DNS propagates, GitHub will issue HTTPS automatically.

## Replace placeholders

Search & replace across the repo:
- `YOURDOMAIN` → your real domain (edgeivaikin.com)
- `hello@YOURDOMAIN` → real email
- `https://t.me/YOUR_BOT` → Telegram bot link
- `https://calendar.app.google/4aFN841D87V6or7q9` → calendar link

## SEO / language notes

- Each language has its own URL path.
- Pages include `hreflang` links + `lang` and `dir` attributes.
- Update `sitemap.xml` after domain change (replace `YOURDOMAIN`).

## Strict rules (do not violate)

This is a **public** repository.

DO NOT commit any of the following:
- bank / investor documents, NDAs, term sheets
- client contracts, statements of work
- private financials, P&L, internal dashboards
- API keys, tokens, passwords, certificates
- private customer data or personally identifying data

Put sensitive materials into a separate private “dataroom” location.

## Ownership & continuity

- Keep at least **2 GitHub org owners** with 2FA enabled.
- Domain: enable auto-renew + keep a backup payment method.
- Keep a local copy of the latest site build (ZIP) as a backup.

## Contact

# Edge High‑Tech Website Starter (EN/RU/ZH/AR)

This is a fast static site (no framework) with:
- EN default at `/`
- RU at `/ru/`
- ZH at `/zh/`
- AR (RTL) at `/ar/`
- hreflang + canonical placeholders
- HTML deck at `/deck/`
- PDF deck file (English) in the root

## Replace placeholders
Search & replace:
- `YOURDOMAIN` (domain only, e.g. edgefocus.ru)
- `hello@YOURDOMAIN` (real email)
- `https://t.me/YOUR_BOT` (your Telegram bot link)
- `https://calendar.app.google/4aFN841D87V6or7q9` (your calendar link)

## Deploy (GitHub Pages)
1) Create a repo and push this folder contents to the repo root.
2) GitHub: Settings -> Pages -> Deploy from branch.
3) Custom domain: set your apex domain (no www), then set DNS A records to GitHub Pages IPs.

## SEO notes
- Keep separate URLs per language.
- Each page includes hreflang and lang/dir attributes.
- Add real OG image at `/assets/og.png`.

- Email: hello@YOURDOMAIN
- Telegram bot: https://t.me/YOUR_BOT
- Calendar: https://calendar.app.google/4aFN841D87V6or7q9

## Partner programme pages

`/partners/` and `/ru/partners/` invite referral, delivery and technology collaboration. They reuse current service descriptions and adapt the existing Strategic System Integrators concept: preserve the partner’s customer relationship, agree roles and work packages, and scope a paid Discovery / Architecture Sprint before delivery where needed. New material is the three-track presentation and application flow. They introduce no current alliance, fixed commission, guaranteed lead or ownership claim, and supersede no existing page or agreement.

The form posts to the dedicated public partner-application API on edgefocus.ru. A validated server receipt confirms storage only, not programme acceptance or a response deadline. Email and Telegram remain visible fallbacks. No tracker or session replay is loaded on these pages. Session storage contains only the retry UUID and opening time; an ambiguous response retries the frozen payload on the current page. Reloads preserve the key but not personal fields.

For a trusted staging build, inject `data-endpoint` on `#partner-form` with the explicit staging API URL. Query parameters never select an endpoint. `?qa=1` is carried through partner navigation but does not fake or suppress a submission. Use synthetic details only when testing against a real server. Run `node --test tests/*.test.mjs`. Live persistence and admin-inbox readiness must be verified before publication; local tests alone do not establish delivery.
