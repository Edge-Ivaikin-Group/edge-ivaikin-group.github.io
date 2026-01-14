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
- `https://cal.com/YOURCAL` (your calendar link)

## Deploy (GitHub Pages)
1) Create a repo and push this folder contents to the repo root.
2) GitHub: Settings -> Pages -> Deploy from branch.
3) Custom domain: set your apex domain (no www), then set DNS A records to GitHub Pages IPs.

## SEO notes
- Keep separate URLs per language.
- Each page includes hreflang and lang/dir attributes.
- Add real OG image at `/assets/og.png`.
