import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const STEPS = [1, 2, 3, 4, 5, 6, 7];
const path = (lang, n) => (lang === 'ru' ? `ru/ladder/${n}/index.html` : `ladder/${n}/index.html`);
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const all = () => ['en', 'ru'].flatMap((lang) => STEPS.map((n) => ({ lang, n, html: read(path(lang, n)) })));
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');

test('seo v2: stays noindex, unique title and description, OG and Twitter cards with an existing image', () => {
  const titles = new Set(); const descs = new Set();
  for (const { lang, n, html } of all()) {
    const id = `${lang}/${n}`;
    assert.match(html, /<meta name="robots" content="noindex">/, id);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    const desc = html.match(/<meta name="description" content="(.*?)"\/>/)[1];
    assert.ok(title.length >= 20 && title.length <= 70, `${id} title ${title.length}`);
    assert.ok(desc.length >= 80 && desc.length <= 170, `${id} description ${desc.length}`);
    assert.ok(!titles.has(title) && !descs.has(desc), `${id} duplicate`);
    titles.add(title); descs.add(desc);
    for (const needle of [`<meta property="og:title" content="${title}"/>`, `<meta name="twitter:title" content="${title}"/>`, '<meta name="twitter:card" content="summary_large_image"/>', '<meta property="og:image:width" content="1200"/>']) assert.ok(html.includes(needle), `${id} ${needle}`);
    const img = html.match(/<meta property="og:image" content="https:\/\/edgeivaikin\.com(\/[^"]+)"\/>/)[1];
    assert.ok(existsSync(new URL('.' + img, root)), `${id} ${img}`);
    assert.match(html, /<meta property="og:locale" content="(en|ru_RU)"\/>/, id);
  }
});

test('seo v2: JSON-LD parses; Organization, WebPage, BreadcrumbList everywhere; Service on 2 and 3; FAQPage on 5 matches visible text', () => {
  for (const { lang, n, html } of all()) {
    const blocks = ld(html);
    assert.equal(blocks.length, 1, `${lang}/${n}`);
    const g = blocks[0]['@graph'];
    const types = g.map((x) => x['@type']);
    for (const t of ['Organization', 'WebPage', 'BreadcrumbList']) assert.ok(types.includes(t), `${lang}/${n} ${t}`);
    assert.equal(types.includes('Service'), n === 2 || n === 3, `${lang}/${n} Service`);
    assert.equal(types.includes('FAQPage'), n === 5, `${lang}/${n} FAQPage`);
    if (n === 5) {
      const faq = g.find((x) => x['@type'] === 'FAQPage');
      assert.equal(faq.mainEntity.length, 3);
      const text = visible(html).replace(/\s+/g, ' ');
      for (const q of faq.mainEntity) assert.ok(text.includes(q.name), `${lang}/5 question visible: ${q.name}`);
    }
    assert.ok(!/"(price|priceCurrency|lowPrice|highPrice)"/.test(JSON.stringify(g)), 'no prices in structured data');
  }
});

test('seo v2: answer blocks on 1,2,3,4,6; share link on 6 with utm; CTA above the fold and sticky CTA present', () => {
  for (const { lang, n, html } of all()) {
    const id = `${lang}/${n}`;
    assert.equal(html.includes('data-answer'), [1, 2, 3, 4, 6].includes(n), id);
    assert.ok(html.includes('data-sticky-cta'), id);
    assert.equal(html.includes('class="hero-cta"'), n < 7, id);
    assert.equal(html.includes('https://t.me/share/url?url='), n === 6, id);
    if (n === 6) assert.ok(decodeURIComponent(html.match(/share\/url\?url=([^&]+)/)[1]).includes('utm_medium=share&utm_campaign=ladder&utm_content=share_s6'), id);
    if (n === 7) assert.ok(html.includes('data-prefill="'), id);
    assert.match(html, /window\.edgeFunnelAB=v/, id);
    assert.ok(html.indexOf('window.edgeFunnelAB=v') < html.indexOf('<link rel="stylesheet"') + 400 || html.indexOf('window.edgeFunnelAB=v') < html.indexOf('</head>'), id);
  }
  const builder = read('scripts/build-funnel.mjs');
  assert.match(builder, /const INDEXABLE = false;/);
  assert.match(builder, /const AB_FORCE = '';/);
});

test('seo v2: new copy has no forbidden terms, no letter yo, no long dash, no money in meta', () => {
  const banned = /(Прогресс|SFIT|ROI|Sovereign|суверенн|Dubai|DMCC|Дубай|[ёЁ]|\u2014)/i;
  for (const { lang, n, html } of all()) {
    const meta = [...html.matchAll(/<(?:title|meta)[^>]*?(?:content="([^"]*)")?[^>]*>([^<]*)/g)].map((m) => (m[1] || '') + (m[2] || '')).join(' ');
    const answer = (html.match(/<div class="answer" data-answer>([\s\S]*?)<\/div>/) || ['', ''])[1];
    const m = (answer + ' ' + meta).match(banned);
    assert.ok(!m, `${lang}/${n}: ${m && m[0]}`);
    const jsonld = JSON.stringify(ld(html)).replace(/ООО «ЭДЖ ЭКОСИСТЕМА»/g, '');
    assert.ok(!/(Прогресс|SFIT|ROI|Sovereign|Dubai|DMCC|[ёЁ])/i.test(jsonld), `${lang}/${n} json-ld`);
    assert.ok(!/(\$|₽|руб)/.test(html.match(/<meta name="description" content="(.*?)"\/>/)[1]), `${lang}/${n} money in description`);
  }
});

// ---- runtime: utm pass-through, ab variant, share, prefill ---------------------------------------------------
function run({ search = '', step = 1, ab, store = {}, pathname = '/ru/ladder/1/' } = {}) {
  const calls = []; const listeners = {}; const dl = []; const timers = [];
  const doc = { documentElement: { getAttribute: () => 'ru' }, referrer: '', visibilityState: 'visible', querySelector: (s) => (s === 'body' ? doc.body : null), addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn); }, querySelectorAll: () => prefillLinks };
  doc.body = { getAttribute: (n) => (n === 'data-funnel-step' ? String(step) : null) };
  const prefillLinks = [{ attrs: { href: 'https://t.me/TimothyIvaikin', 'data-prefill': 'Привет!\nТема: ' }, getAttribute(n) { return this.attrs[n] ?? null; }, setAttribute(n, v) { this.attrs[n] = v; } }];
  const win = {
    location: { hostname: 'edgeivaikin.com', pathname, search, href: 'https://edgeivaikin.com' + pathname + search },
    sessionStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    addEventListener: (t, fn) => { (listeners['w:' + t] ||= []).push(fn); }, removeEventListener() {}, requestAnimationFrame: (fn) => fn(),
    innerHeight: 800, scrollY: 0, dataLayer: dl, edgeFunnelAB: ab, edgeFunnelEntry: 'funnel_page',
    ym: (...a) => calls.push(JSON.parse(JSON.stringify(a))),
  };
  doc.documentElement.scrollHeight = 4000; win.document = doc;
  const ctx = { window: win, document: doc, URL, Date, Object, JSON, String, encodeURIComponent, decodeURIComponent };
  runInNewContext(read('assets/goals.js'), ctx);
  runInNewContext(read('assets/ladder-funnel.js'), ctx);
  const link = (href, attrs = {}) => ({ target: { closest: (s) => (s.startsWith('a') ? { getAttribute: () => href, hasAttribute: (n) => n in attrs } : null) } });
  return { calls, dl, store, win, prefillLinks, click: (href, attrs) => (listeners.click || []).forEach((fn) => fn(link(href, attrs))) };
}
const UTM = '?utm_source=telegram&utm_medium=story&utm_campaign=ladder&utm_content=edge_ru_s1a&utm_term=hook_a';

test('utm pass-through: five utm keys and ab_cro go into every funnel event and cta goal; stored for the next step', () => {
  const r = run({ search: UTM, ab: 'b' });
  assert.equal(r.calls[0][2], 'ladder_1_landing');
  const p = r.calls[0][3];
  assert.deepEqual([p.utm_source, p.utm_medium, p.utm_campaign, p.utm_content, p.utm_term, p.ab_cro], ['telegram', 'story', 'ladder', 'edge_ru_s1a', 'hook_a', 'b']);
  assert.equal(p.source, 'campaign');
  r.click('https://t.me/TimothyIvaikin');
  const goal = r.calls.find((c) => c[2] === 'cta_telegram')[3];
  assert.equal(goal.utm_content, 'edge_ru_s1a'); assert.equal(goal.entry, 'funnel_page'); assert.equal(goal.ab_cro, 'b');
  assert.equal(r.dl.find((x) => x.event === 'cta_telegram').utm_campaign, 'ladder');
  // next step: no query string, utm comes from the session
  const r2 = run({ search: '', step: 2, ab: 'a', store: r.store, pathname: '/ru/ladder/2/' });
  r2.click('https://t.me/share/url?url=x');
  const intent = r2.calls.find((c) => c[2] === 'ladder_aux_share')[3];
  assert.equal(intent.utm_source, 'telegram'); assert.equal(intent.utm_content, 'edge_ru_s1a'); assert.equal(intent.ab_cro, 'a');
});

test('utm pass-through: unsafe or oversized values are dropped, other query keys never pass, no utm means no keys', () => {
  const r = run({ search: '?utm_source=<script>&utm_medium=' + 'x'.repeat(65) + '&utm_campaign=ok_1&email=a%40b.ru&utm_content=a%20b' });
  const p = r.calls[0][3];
  assert.equal(p.utm_campaign, 'ok_1');
  for (const k of ['utm_source', 'utm_medium', 'utm_content', 'email', 'ab_cro']) assert.ok(!(k in p), k);
  const plain = run({});
  assert.ok(!Object.keys(plain.calls[0][3]).some((k) => k.startsWith('utm_')));
  assert.deepEqual(Object.keys(plain.store), ['edge_ladder_funnel_v1']);
});

test('share link is a share event, not intent or conversion; variant B prefills the Telegram chat, A does not', () => {
  const r = run({ ab: 'a' });
  r.click('https://t.me/share/url?url=https%3A%2F%2Fedgeivaikin.com%2Fru%2Fladder%2F6%2F&text=x');
  assert.deepEqual(r.calls.map((c) => c[2]), ['ladder_1_landing', 'cta_share', 'ladder_aux_share']);
  assert.ok(r.dl.some((x) => x.event === 'cta_share') && !r.dl.some((x) => x.event === 'ladder_7_conversion'));
  assert.equal(r.prefillLinks[0].attrs.href, 'https://t.me/TimothyIvaikin');
  const b = run({ ab: 'b' });
  assert.equal(b.prefillLinks[0].attrs.href, 'https://t.me/TimothyIvaikin?text=' + encodeURIComponent('Привет!\nТема: '));
});
