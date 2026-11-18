# Hunt ladder funnel (Yandex Metrika 108284737)

Added by S2 (`assets/ladder.js`). It shows where visitors drop off on the way from the first visit to a direct contact.
The script is loaded after `goals.js` on `/`, `/ru/`, `/zh/`, `/ar/` and `/ru/automation-ai/`.
It sends `ym(108284737, "reachGoal", <id>, <params>)`. If `ym` is blocked or missing, nothing happens.
No markup, text or design is changed. Existing goals (`cta_*`, `hero_cta`, `contact_*`, `sticky_*`) keep working in parallel.

## Ladder stages (Ben Hunt, levels of awareness) and goal ids

| Hunt level | Goal id (JavaScript event) | Fires when |
| :-- | :-- | :-- |
| Unaware | `ladder_1_landing` | first page of a visit (entry category in `entry`) |
| Problem aware | `ladder_2_problem` | the problem section stays in view for 0.5 s |
| Solution aware | `ladder_3_solution` | the approach section stays in view for 0.5 s |
| Product aware (proof) | `ladder_4_proof` | the first block of cases or trust proof stays in view |
| Product aware (offer) | `ladder_5_offer` | pricing, format or questions stay in view |
| Most aware (intent) | `ladder_6_intent` | click to the contact block, or first touch of a lead form field |
| Most aware (action) | `ladder_7_conversion` | direct contact action: calendar, Telegram, bot, email, WhatsApp, phone, valid form submit |
| helper | `ladder_aux_contact_view` | contact block (or lead form) stays in view |
| helper | `ladder_aux_scroll_50`, `ladder_aux_scroll_90` | the visitor has seen 50 or 90 percent of the page height |
| helper | `ladder_aux_time_30s` | 30 seconds with the tab visible |

Rules:
- Each id fires once per visit. A visit is 30 minutes, kept in `sessionStorage` (`edge_ladder_v1`); in memory if storage is blocked. A second page in the same visit does not repeat `ladder_1_landing`.
- A section counts only after 0.5 s in the upper 70 percent of the screen. Fast scrolling past a block does not count, and a jump by anchor counts only the block it lands on.
- `ladder_7_conversion` always sends `ladder_6_intent` first, so the funnel is nested. `ladder_7_conversion` is a proxy: a click on the calendar link is not a confirmed booking; confirm bookings in the calendar and EdgeFocus.
- Not counted as contact: LinkedIn, the channel link (`cta_channel`) and PDF downloads. They keep their own goals.

## Parameters (goal parameters in Metrika)

| Parameter | Values |
| :-- | :-- |
| `lang` | `en`, `ru`, `zh`, `ar` |
| `ab_hero` | `A`, `B`, `forced_A`, `forced_B` on `/` and `/ru/` (set by `assets/ab-hero.js` as `window.edgeAbHero`); `none` elsewhere |
| `page` | page path, for example `/ru/` |
| `entry` (landing only) | `direct`, `search`, `social`, `messenger`, `referral`, `internal`, `campaign` (utm), `paid` (utm_medium cpc, ppc, paid) |
| `section` | id of the block that was seen |
| `trigger` (intent) | `anchor`, `form_start`, or the channel of the contact click |
| `channel` (conversion) | `calendar`, `telegram`, `bot`, `email`, `whatsapp`, `phone`, `form` |

No URLs, queries or visitor input are sent.

## Page and section map

Home pages `/`, `/ru/`, `/zh/`, `/ar/` (same ids in every language):

| Stage | Block (selector) |
| :-- | :-- |
| 1 landing | page load, first screen `.hero` |
| 2 problem | `#capabilities` (where Edge can help / which tasks come in) |
| 3 solution | `#model` (engagement model, why clients trust it) |
| 4 proof | `#proof`, `#history`, `#sovereign`, `#enterprise` (first one seen) |
| 5 offer | `#pricing`, `#questions`, `#proposal-review` (`/ru/` only) |
| 6 intent | click on any `href="#contact"` (hero button, sticky button, menu) |
| 7 conversion | click on the calendar link, personal Telegram, bot, email, WhatsApp, phone |
| helper | `#contact` seen |

Variant B of the hero test sends the visitor straight to the calendar, so a B click sends stages 6 and 7 at once. Compare A and B by `hero_cta` and by `ladder_7_conversion`, not by stage 6.

`/ru/automation-ai/` (own map, there is no case block, so `ladder_4_proof` does not fire):

| Stage | Block |
| :-- | :-- |
| 2 problem | `.signal-strip`, `#examples` |
| 3 solution | `section.fit`, `section.method` |
| 5 offer | `section.lead-section`, `section.faq` |
| 6 intent | click on `href="#lead-form"`, or focus in the first lead form field |
| 7 conversion | valid form submit (WhatsApp hand-off), valid "copy for Telegram" button, contact links |
| helper | `#lead-form` seen |

`/company/` and `/deck/` do not load the ladder (requisites and slides, not a sales path).

## What to create in Metrika

1. Goals of type "JavaScript event", identifier equal to the id: `ladder_1_landing` to `ladder_7_conversion` (7) and the four `ladder_aux_*` (4).
2. Composite goals (Metrika allows up to 5 steps per composite goal, so two):
   - `ladder_reading`: `ladder_1_landing`, `ladder_2_problem`, `ladder_3_solution`, `ladder_4_proof`, `ladder_5_offer`.
   - `ladder_closing`: `ladder_1_landing`, `ladder_5_offer`, `ladder_6_intent`, `ladder_7_conversion`.
3. Segment reports by goal parameter `ab_hero`, `lang`, `entry` (Reports, Conversions, goal parameters) or by the visit parameter `ab_hero`.

## Rollback

Revert the S2 merge commit (`git revert -m 1 <merge sha>`). This removes `assets/ladder.js`, the five script tags and the one `window.edgeAbHero` line. GitHub Pages updates in 1 to 5 minutes. Tests: `tests/ladder.test.mjs`.
