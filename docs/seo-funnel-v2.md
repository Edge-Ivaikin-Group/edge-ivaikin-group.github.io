# Funnel pages v2: SEO, GEO and CRO pass (18.11.2026)

Scope: /ladder/1..7 and /ru/ladder/1..7 of edgeivaikin.com. Generator: `scripts/build-funnel.mjs`. Task: EdgeFocus #30896.

## Indexing decision

The funnel pages stay `noindex` (constant `INDEXABLE = false` in the generator).

Why: the pages repeat wording of the home page, cases and pricing, so indexing them now would compete with those pages and add thin duplicates. The story A/B uses `entry=funnel_page` to separate this traffic, and organic visitors would mix into it. Reversing is one constant plus a rebuild, but already indexed URLs linger in search for weeks, so the safe order is: measure first, index later.

Recommendation: after the 7-day review, index only step 1 and step 4 (the two pages with a unique angle), keep canonical on the page itself, add them to sitemap.xml, leave steps 2, 3, 5, 6, 7 noindex. Needs Timothy's yes.

Effect of noindex: the structured data, answer blocks and meta below have no search or AI-engine effect until a page is indexed. Today they matter for link previews (story and share links), consistency and readiness. The home pages remain the pages that search and AI engines see.

## What changed

| Change | Pages | Measured how |
| --- | --- | --- |
| Unique title and description per page, OG and Twitter cards with the existing site image | all 14 | before/after, link preview check |
| JSON-LD: Organization (Person on ivaikin.com), WebPage, BreadcrumbList on all; Service on step 2 (and 3 on edgeivaikin.com); FAQPage on step 5, text identical to the visible FAQ | all 14 | structured data validator, tests |
| Quotable answer blocks (question heading + 2 sentence answer, only claims already on the site) | steps 1,2,3,4,6 (edge), 2,3,4,6 (iv) | before/after on indexed pages only after the indexing decision |
| UTM pass-through: utm_source, utm_medium, utm_campaign, utm_content, utm_term and ab_cro as event parameters in ladder-funnel.js and funnel.js; stored in sessionStorage for the next steps; values limited to [A-Za-z0-9_.-] up to 64 characters | all | tests, Metrika/GA4 parameter reports |
| ivaikin.com only: GA4 `page_location` now keeps the five safe utm keys (it dropped the whole query, so GA4 could not attribute story traffic) | all | GA4 session source for utm_source=telegram |
| Telegram share button for the checklist (step 6), event `ladder_aux_share` (+ `cta_share` bridge) | step 6 | share clicks, visits with utm_medium=share |
| llms.txt for ivaikin.com (edgeivaikin.com already had one) | site | file present |
| CRO bundle B (random 50/50 per browser, key `edge_funnel_ab_cro_v1` / `iv_funnel_ab_cro_v1`): CTA above the fold, sticky mobile CTA, Telegram chat opens with the brief points typed in, step 7 shows fewer options | all | see below |

## A/B: CRO bundle (A = control, B = test)

Event parameter `ab_cro` = a or b on every funnel event and cta_* goal.

| Item | Value |
| --- | --- |
| Primary metric | share of visits with ladder_1_landing that reach ladder_7_conversion, per ab_cro |
| Secondary | landing to ladder_6_intent; cta_telegram share; ladder_aux_scroll_50 (guardrail: must not fall) |
| Decision threshold (my assumption) | at least 100 landing visits per variant and B at least 20% higher relative conversion, or at least 10 more conversions than A |
| Inconclusive | below the sample size at day 14: keep B only if secondary metrics are not worse, otherwise roll back |
| Rollback trigger | B conversion lower than A by 20% relative after 100 visits per variant, or scroll_50 share of B lower than A by 15% relative, or any layout defect on mobile |
| Rollback action | set `AB_FORCE = 'a'` in scripts/build-funnel.mjs, run `node scripts/build-funnel.mjs`, merge. Takes minutes, no CSS change |
| Review point | 7 days after the first story, then 14 days |

The bundle is tested as one unit because traffic is small: separate tests of each element would never reach a readable sample. If B wins, a later round can split the elements.

## Not A/B testable (before/after only)

| Change | Metric | Threshold | Rollback trigger |
| --- | --- | --- | --- |
| Meta, OG, JSON-LD, answer blocks | structured data validates; link preview shows title, text and image; after indexing: impressions and clicks per page in Search Console | validator without errors; no layout shift | validator errors or a wrong preview: revert the commit |
| UTM pass-through | share of ladder_1_landing events from stories that carry utm_content | at least 95% of landings with utm in the URL | below 95%: stop the stories, fix the script |
| Core Web Vitals | Lighthouse performance, LCP, CLS, TBT | no drop of more than 3 points or LCP up by more than 300 ms against the baseline | revert the commit |

## Manual steps that code cannot do

- GA4: register `utm_content`, `utm_term`, `ab_cro` as event-scoped custom dimensions (Admin, Custom definitions) to see them per event. Session-level source, medium, campaign and content already work from page_location.
- GTM on edgeivaikin.com: the trigger `^(cta_|form_submit|pdf_download)` forwards the event name; event parameters need to be mapped in the GA4 tag (utm_*, ab_cro, entry, funnel_step).
- Yandex Metrika: reachGoal parameters are visible in Parameters reports without extra setup; goals for ladder_aux_share can be added later.

## Flip to indexable (only after the decision)

1. Set `INDEXABLE = true` in scripts/build-funnel.mjs, rebuild.
2. Add the chosen URLs to sitemap.xml; for the others set noindex per page.
3. Update tests: `seo-v2.test.mjs` expects noindex everywhere.

## Decision 19.11.2026 (executed 26.11.2026)

Timothy approved: steps 1 and 4 (EN and RU) are indexable (index,follow, self canonical) and listed in sitemap.xml. Steps 2, 3, 5, 6, 7 stay noindex. Constant INDEX_STEPS in scripts/build-funnel.mjs. Revert: set INDEX_STEPS = [] and rebuild, remove the 4 sitemap entries.
