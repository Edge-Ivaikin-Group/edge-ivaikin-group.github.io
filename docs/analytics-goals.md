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
