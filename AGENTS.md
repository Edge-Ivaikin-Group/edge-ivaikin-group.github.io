# AGENTS.md
Operational playbook for AI agents (and humans) working on the **Edge Ecosystem public website**.

Goal: ship **enterprise-credible** updates fast, keep the site **always online**, and avoid the historical failure mode: “life chaos → missed renewals/updates → site dies”.

This repo is a **static, public** marketing site. It must stay **thin, fast, multilingual, and audit-safe**.

Last updated: 2026-01-03  
Owner: Edge-Ivaikin-Group maintainers

---

## 0) Context: what this repo is (and is not)

This repo **is**:
- Public website (EN/RU/ZH/AR) + HTML deck + PDF deck
- Trust packaging for partners, banks, investors, and hiring
- Static files only (HTML/CSS/JS), designed for GitHub Pages + custom domain

This repo is **not**:
- A dataroom
- A product codebase
- A place for client confidentials, contracts, financials, or credentials

Non-negotiable: **no secrets, no NDA material, no private numbers that require evidence**.

---

## 1) Prime directive (Edge mode)

1) Ship the **smallest safe change** that increases trust or conversion.
2) Keep the site **boringly reliable**: fewer moving parts > fancy stacks.
3) Maintain **enterprise legibility**: clear claims, no hype, no unsafe promises.
4) If instructions conflict: **User request > README > this file > conventions**.

---

## 2) Trust packaging rules (banks/investors/enterprise)

The site must be:
- **Factual**: claims should be verifiable or framed as capabilities, not promises.
- **Audit-safe**: “Before → Shipped → Outcome” with metrics only if real.
- **Transferable**: wording supports assignable contracts + IP owned by LLC.

Never publish:
- “Guaranteed results”, “we will 10x”, “best in the world”
- Client names/logos without explicit permission
- Sensitive partner references or private deal details

If uncertain: default to **generic** case cards and replace later.

---

## 3) Multilingual and SEO rules (do not break)

Language strategy:
- Separate URLs per language:
  - `/` (EN default), `/ru/`, `/zh/`, `/ar/`
- Keep `lang` and `dir` correct:
  - Arabic pages must be `dir="rtl"`
- Maintain `hreflang` links across all languages on every page
- Keep canonical pointing to the custom domain (placeholder `YOURDOMAIN`)

When editing content:
- Keep meaning consistent across languages (no contradictions)
- Prefer short, clear sentences (translation durability)
- Avoid slang and culture-specific idioms

SEO basics to keep intact:
- `sitemap.xml` must include all language URLs
- `robots.txt` must point to sitemap
- Titles and meta descriptions should be language-appropriate, not duplicated

---

## 4) Performance budget (this is a “fast site”, always)

Hard constraints:
- No frameworks, no heavy build chain, no runtime dependencies
- Avoid new fonts, trackers, or analytics by default

Performance guidelines:
- Keep JS minimal (prefer 0 JS unless needed)
- Images:
  - Use compressed formats (prefer `.webp`), keep sizes small
  - Avoid shipping huge hero videos
- One CSS file + one JS file is the default; only split if justified

If you add anything that could slow down:
- justify why it is worth it
- provide a rollback plan

---

## 5) Repo map (keep accurate)

- `index.html` — EN landing
- `ru/index.html` — RU landing
- `zh/index.html` — ZH landing
- `ar/index.html` — AR landing (RTL)
- `deck/index.html` — HTML capabilities deck
- `assets/styles.css` — global styles (high-tech theme)
- `assets/app.js` — minimal JS (smooth scroll + deck keys)
- `sitemap.xml` — sitemap (replace `YOURDOMAIN`)
- `robots.txt` — robots + sitemap pointer
- `EdgeEcosystem_Capabilities_Deck_EN.pdf` — PDF deck (EN)

If you add a new top-level folder: update this section.

---

## 6) Update types and how to do them

### A) Content change (most common)
- Change EN first, then mirror meaning into RU/ZH/AR
- Keep paragraphs short and scannable
- If you add a “Case”, update all languages with a safe equivalent
- Never add a case metric unless it’s real and approved

### B) Design tweak
- Keep contrast readable and typography simple
- Do not introduce a design system dependency
- Avoid “big refactors”; prefer surgical CSS updates
- Must work on mobile (320px width)

### C) SEO tweak
- Do not change URL structure without explicit instruction
- If you add a new page, update:
  - hreflang on all pages
  - sitemap.xml
  - navigation (if relevant)

### D) PDF deck update
- PDF is an accessory, the HTML deck is primary
- Keep PDF short and enterprise-legible
- Do not embed confidential content in PDF

---

## 7) Definition of Done (DoD)

A change is “done” when:
- Site loads and renders correctly on desktop + mobile widths
- EN/RU/ZH/AR remain accessible and consistent
- `hreflang` and canonical are preserved
- No broken links (especially contact CTA and deck links)
- No secrets/confidential data added
- README updated if setup or structure changed

---

## 8) Verification (prove, don’t guess)

Minimum verification for any PR:
- Open these locally (or in Pages preview):
  - `/` `/ru/` `/zh/` `/ar/` `/deck/`
- Check mobile layout quickly (browser devtools)
- Click CTAs (email, bot, calendar) to ensure targets are correct
- Ensure Arabic layout feels sane (RTL not broken)

If you changed SEO-related tags:
- Confirm `link rel="alternate" hreflang=...` still present on every page
- Confirm canonical points to `YOURDOMAIN`

If you changed assets:
- Confirm paths are absolute (`/assets/...`) and work under Pages

---

## 9) Ask policy (max 1 blocking question)

Ask **at most one** blocking question only if it changes implementation materially.

Good blocking questions:
- “Do we have permission to publish Client X name/logo?”
- “Should this case include real numbers, or stay generic until approved?”

Not blocking:
- micro copy preferences
- cosmetic variations

Proceed with best effort if not blocking; state assumptions.

---

## 10) Security, privacy, and compliance (non-negotiable)

Never add:
- API keys, tokens, passwords, certs
- tracking pixels / analytics / telemetry without explicit request
- personal data, deal terms, bank docs, NDAs, contracts

If you discover secrets already in the repo:
- stop and report clearly
- propose removal and rotation steps (no drama, just fix)

---

## 11) Release discipline (avoid “site drift”)

This site wins by staying clean and current.

Default cadence:
- 1 small update per week (copy, one case, one proof artifact)
- Avoid long refactors; they create “never finished” states

Change strategy:
- Prefer small PRs with one intent
- Keep a rollback by reverting the commit

---

## 12) Agent output format (required)

When delivering work, include:

1) Summary (1–3 bullets)
2) Files changed
3) What you verified (exact steps)
4) Any assumptions + risks
5) Follow-ups (optional, max 3)

Example:

- Summary: Updated EN hero copy; aligned RU/ZH/AR translations; fixed deck CTA.
- Files: index.html, ru/index.html, zh/index.html, ar/index.html, deck/index.html
- Verified: opened all 5 pages locally; checked mobile width; clicked CTAs
- Assumptions: client names not approved, kept generic
- Risks: none; revert commit if needed

---

## 13) “Do not break” checklist (sticky)

Before merging, confirm:
- [ ] EN/RU/ZH/AR all render
- [ ] Arabic still RTL
- [ ] hreflang present and correct
- [ ] canonical uses `YOURDOMAIN`
- [ ] sitemap + robots intact
- [ ] No confidential data added
- [ ] Mobile looks good enough

---

## 14) Dataroom policy (where sensitive things go)

Sensitive materials must live elsewhere:
- Separate private repo (not Pages), or
- Private cloud folder with access controls

This site may only link to dataroom behind NDA/auth (never host it here).

---
