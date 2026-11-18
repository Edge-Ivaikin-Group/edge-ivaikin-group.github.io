# Analytics goals (Yandex Metrika 108284737)

Added by experiment E1 (`assets/goals.js`). The script is loaded on every page that has the Metrika counter:
`/`, `/ru/`, `/zh/`, `/ar/`, `/company/`, `/deck/`, `/ru/automation-ai/`.
It sends `ym(108284737, "reachGoal", <id>)` on click or submit. If `ym` is missing or blocked, nothing happens.
No markup, text or design is changed. The older `data-goal` goals from `assets/app.js` (`contact_*`, `sticky_*`) keep working in parallel.

| Goal id | Fires on |
| :-- | :-- |
| `cta_calendar` | click on a `calendar.app.google` link |
| `cta_telegram` | click on a personal Telegram link (`t.me/<name>`), and on the Telegram hand-off button of the lead form when the form is valid |
| `cta_bot` | click on a Telegram bot link (`t.me/...bot`) |
| `cta_channel` | click on the channel link (`t.me/timothy_ivaikin_ru` or an invite link `t.me/+...`, `t.me/joinchat/...`) |
| `cta_email` | click on a `mailto:` link |
| `cta_whatsapp` | click on `wa.me` or `api.whatsapp.com` |
| `cta_linkedin` | click on a `linkedin.com` link |
| `pdf_download` | click on a link to a `.pdf` file |
| `form_submit` | submit of a form after browser validation passes (e.g. the lead form on `/ru/automation-ai/`) |

Create each goal in Metrika as a "JavaScript event" with the identifier equal to the goal id.

Rollback: `git revert <commit>` of the single E1 commit; GitHub Pages updates in 1-5 minutes.

## E2: hero button test (`/` and `/ru/`)

`assets/ab-hero.js` splits visitors 50/50 and stores the variant in `localStorage` (`edge_ab_hero`).
A = current button to `#contact`. B = "Book a 20-minute call" / "Выбрать время для 20-минутного разговора" straight to the calendar link (B clicks also fire `cta_calendar`).
Metrika: visit parameter `ab_hero` = `A` or `B` (`forced_A` / `forced_B` while the flag is set), and goal `hero_cta` (JavaScript event, create it in Metrika) with the same parameter on a click of the first-screen primary button.
Rollback to A for everyone: in `assets/ab-hero.js` set `var FORCE = "A";` (or revert the E2 commit).

## E3: channel note (`/` and `/ru/`)

A small note in the contact section links to the Telegram channel. The link constant is `CHANNEL_URL` in `assets/channel.js` (the HTML carries the same URL as a no-JS fallback). A click fires `cta_channel`.
To switch to a per-site invite link, change `CHANNEL_URL` and the two `href` fallbacks. Rollback: revert the E3 commit.
