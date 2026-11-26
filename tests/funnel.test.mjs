import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const STEPS = [1, 2, 3, 4, 5, 6, 7];

// Minimal browser: sections by selector, IntersectionObserver, timers, listeners.
function browser({ selectors = [], lang = 'en', ym = true, sessionThrows = false, referrer = '', search = '', edgeAbHero, io = true, pathname = '/' } = {}) {
  const calls = [];
  const listeners = {};
  const timers = [];
  const store = {};
  const observers = [];
  const els = {};
  for (const s of selectors) els[s] = { id: s.startsWith('#') ? s.slice(1) : '', tagName: 'SECTION', closest: () => null };
  const doc = {
    documentElement: { getAttribute: () => lang },
    referrer,
    visibilityState: 'visible',
    querySelector: (s) => els[s] || null,
    addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn); },
  };
  class IO {
    constructor(cb) { this.cb = cb; this.targets = []; observers.push(this); }
    observe(el) { this.targets.push(el); }
    unobserve(el) { this.targets = this.targets.filter((x) => x !== el); }
  }
  const win = {
    location: { hostname: 'edgeivaikin.com', pathname, search, href: 'https://edgeivaikin.com' + pathname + search },
    sessionStorage: {
      getItem: (k) => { if (sessionThrows) throw new Error('blocked'); return store[k] ?? null; },
      setItem: (k, v) => { if (sessionThrows) throw new Error('blocked'); store[k] = v; },
    },
    setTimeout: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length; },
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].live = false; },
    setInterval: (fn, ms) => { timers.push({ fn, ms, live: true, every: true }); return timers.length; },
    clearInterval: (id) => { if (timers[id - 1]) timers[id - 1].live = false; },
    addEventListener: (t, fn) => { (listeners['w:' + t] ||= []).push(fn); },
    removeEventListener: () => {},
    requestAnimationFrame: (fn) => fn(),
    innerHeight: 800, scrollY: 0,
    edgeAbHero,
  };
  if (ym) win.ym = (...a) => calls.push(JSON.parse(JSON.stringify(a)));
  if (io) win.IntersectionObserver = IO;
  doc.documentElement.scrollHeight = 4000;
  const ctx = { window: win, document: doc, URL, Date, Object, JSON };
  win.document = doc;
  return {
    calls, els, timers, store, observers, doc, win,
    run: (src) => runInNewContext(src, ctx),
    fire: (t, ev) => (listeners[t] || []).forEach((fn) => fn(ev)),
    fireWin: (t) => (listeners['w:' + t] || []).forEach((fn) => fn()),
    see(sel) { // section enters the view, stays long enough
      const o = observers[0];
      o.cb([{ target: els[sel], isIntersecting: true }]);
      timers.filter((t) => t.live && !t.every && t.ms === 500).forEach((t) => { t.live = false; t.fn(); });
    },
    goals: () => calls.filter((c) => c[1] === 'reachGoal').map((c) => c[2]),
  };
}


const linkEvent = (href, extraAttrs = {}) => ({ target: { closest: (s) => (s.startsWith('a') ? { getAttribute: () => href, hasAttribute: (n) => n in extraAttrs } : null) } });
function funnelBrowser(step, opts = {}) {
  const b = browser({ selectors: ['body', '[data-ladder-stage]', '#contact'], pathname: `/ladder/${step}/`, ...opts });
  // body carries the step number; the stage block is the element observed by the script
  b.els['body'].getAttribute = (n) => (n === 'data-funnel-step' ? String(step) : null);
  b.els['[data-ladder-stage]'].id = `step-${step}`;
  b.doc.body = b.els['body'];
  return b;
}
const SRC = () => read('assets/ladder-funnel.js');
const pagePath = (lang, n) => (lang === 'ru' ? `ru/ladder/${n}/index.html` : `ladder/${n}/index.html`);

test('funnel pages: 7 steps in EN and RU, noindex, canonical, scripts, chain of next links, contact CTA', async () => {
  for (const lang of ['en', 'ru']) {
    for (const n of STEPS) {
      const html = await read(pagePath(lang, n));
      const url = lang === 'ru' ? `/ru/ladder/${n}/` : `/ladder/${n}/`;
      assert.match(html, [1, 4].includes(n) ? /<meta name="robots" content="index,follow">/ : /<meta name="robots" content="noindex">/, url);
      assert.ok(html.includes(`<link rel="canonical" href="https://edgeivaikin.com${url}"/>`), url);
      assert.ok(html.includes(`data-funnel-step="${n}"`), url);
      assert.ok(html.includes('window.edgeFunnelEntry="funnel_page"'), url);
      const g = html.indexOf('<script src="/assets/goals.js" defer></script>');
      const l = html.indexOf('<script src="/assets/ladder-funnel.js" defer></script>');
      assert.ok(g > 0 && l > g, url);
      assert.ok(!html.includes('/assets/ladder.js'), `${url} must not load the existing-page ladder`);
      assert.ok(html.includes('GTM-WXMB3PPH') && html.includes('108284737'), url);
      const base = lang === 'ru' ? '/ru/ladder/' : '/ladder/';
      if (n < 7) {
        assert.ok(html.includes(`class="btn primary" href="${base}${n + 1}/"`), `${url} next`);
        assert.ok(html.includes(`href="${base}7/" data-ladder-contact`), `${url} contact`);
      } else {
        for (const needle of ['https://t.me/TimothyIvaikin', 'https://calendar.app.google/', 'mailto:hello@edgeivaikin.com', 'tel:+79956573730']) assert.ok(html.includes(needle), `${url} ${needle}`);
      }
    }
  }
});

test('funnel pages are not in the sitemap, robots.txt or the main navigation of existing pages', async () => {
  const sm = await read('sitemap.xml'); for (const n of STEPS) for (const u of [`/ladder/${n}/`, `/ru/ladder/${n}/`]) assert.equal(sm.includes('<loc>https://edgeivaikin.com' + u + '</loc>'), [1, 4].includes(n), u);
  assert.ok(!(await read('robots.txt')).includes('ladder'));
  for (const f of ['index.html', 'ru/index.html', 'zh/index.html', 'ar/index.html', 'ru/anticrisis/index.html', 'ru/automation-ai/index.html']) {
    assert.ok(!(await read(f)).includes('/ladder/'), f);
  }
});

test('funnel copy: no NDA names, no unsourced hype, no forbidden terms', async () => {
  const banned = /(Прогресс|SFIT|ROI|Sovereign|суверенн|Dubai|Дубай|Дубае|guarantee|гарант|[ёЁ]|\u2014\s*\u2014)/i;
  for (const lang of ['en', 'ru']) for (const n of STEPS) {
    const html = await read(pagePath(lang, n));
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    const m = text.match(banned);
    assert.ok(!m, `${lang}/${n}: ${m && m[0]}`);
  }
});

test('funnel events: ladder order, entry=funnel_page, funnel_step, own params; each once', async () => {
  const src = await SRC();
  const b = funnelBrowser(3, { lang: 'en', referrer: 'https://www.linkedin.com/feed/' });
  b.run(src);
  assert.deepEqual(b.calls[0], [108284737, 'reachGoal', 'ladder_1_landing', { lang: 'en', ab_hero: 'none', page: '/ladder/3/', entry: 'funnel_page', funnel_step: 3, source: 'social', landing: '/ladder/3/' }]);
  b.see('[data-ladder-stage]');
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_3_solution']);
  assert.equal(b.calls[1][3].section, 'step-3');
  b.see('[data-ladder-stage]');
  assert.equal(b.goals().length, 2);
});

test('funnel events: step 2, 4, 5 report their own stage; step 6 is intent on page view', async () => {
  const src = await SRC();
  for (const [step, id] of [[2, 'ladder_2_problem'], [4, 'ladder_4_proof'], [5, 'ladder_5_offer']]) {
    const b = funnelBrowser(step);
    b.run(src);
    b.see('[data-ladder-stage]');
    assert.deepEqual(b.goals(), ['ladder_1_landing', id]);
  }
  const b = funnelBrowser(6);
  b.run(src);
  b.see('[data-ladder-stage]');
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_6_intent']);
  assert.equal(b.calls[1][3].trigger, 'step_page');
});

test('funnel events: contact step link is intent; direct contact is intent then conversion; soft links ignored', async () => {
  const src = await SRC();
  const b = funnelBrowser(2);
  b.run(src);
  b.fire('click', linkEvent('/ladder/3/'));
  b.fire('click', linkEvent('https://www.linkedin.com/in/timothyivaikin/'));
  b.fire('click', linkEvent('https://t.me/timothy_ivaikin_ru'));
  assert.deepEqual(b.goals(), ['ladder_1_landing']);
  b.fire('click', linkEvent('/ladder/7/', { 'data-ladder-contact': '' }));
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_6_intent']);
  assert.equal(b.calls.at(-1)[3].trigger, 'contact_step');
  b.fire('click', linkEvent('https://calendar.app.google/4aFN841D87V6or7q9'));
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_6_intent', 'ladder_7_conversion']);
  const last = b.calls.at(-1)[3];
  assert.equal(last.channel, 'calendar');
  assert.equal(last.entry, 'funnel_page');
  assert.equal(last.funnel_step, 2);
});

test('funnel events: step 7 contact block view, scroll and time helpers', async () => {
  const src = await SRC();
  const b = funnelBrowser(7);
  b.run(src);
  b.see('#contact');
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_aux_contact_view']);
  b.win.scrollY = 3300;
  b.fireWin('scroll');
  assert.ok(b.goals().includes('ladder_aux_scroll_50') && b.goals().includes('ladder_aux_scroll_90'));
});

test('funnel script: own storage key, dataLayer bridge, safe without ym, storage or IntersectionObserver', async () => {
  const src = await SRC();
  const b = funnelBrowser(1, { ym: false, sessionThrows: true, io: false });
  b.win.dataLayer = [];
  b.run(src);
  b.fire('click', linkEvent('https://t.me/TimothyIvaikin'));
  assert.deepEqual(b.win.dataLayer.map((x) => x.event), ['ladder_1_landing', 'ladder_6_intent', 'ladder_7_conversion']);
  assert.equal(b.win.dataLayer[0].entry, 'funnel_page');
  const b2 = funnelBrowser(1);
  b2.run(src);
  assert.ok(Object.keys(b2.store).every((k) => k === 'edge_ladder_funnel_v1'));
});

test('funnel link classes stay identical to assets/ladder.js', async () => {
  const pick = (s) => s.slice(s.indexOf('function channelForLink'), s.indexOf('function intent('));
  assert.equal(pick(await SRC()), pick(await read('assets/ladder.js')));
});

test('goals.js: funnel pages add entry=funnel_page; other pages send the plain goal; GA4 bridge pushes to dataLayer', async () => {
  const src = await read('assets/goals.js');
  const run = (entry) => {
    const calls = []; const listeners = {};
    const win = { ym: (...a) => calls.push(a), dataLayer: [], location: { href: 'https://edgeivaikin.com/ladder/7/' }, edgeFunnelEntry: entry };
    const doc = { addEventListener: (t, fn) => { listeners[t] = fn; }, querySelector: () => null };
    runInNewContext(src, { window: win, document: doc, URL, String });
    listeners.click({ target: { closest: (s) => (s.startsWith('a') ? { getAttribute: () => 'https://t.me/TimothyIvaikin' } : null) } });
    return JSON.parse(JSON.stringify({ calls, dl: win.dataLayer }));
  };
  const plain = run(undefined);
  assert.deepEqual(plain.calls, [[108284737, 'reachGoal', 'cta_telegram']]);
  assert.deepEqual(plain.dl, [{ event: 'cta_telegram' }]);
  const fun = run('funnel_page');
  assert.deepEqual(fun.calls, [[108284737, 'reachGoal', 'cta_telegram', { entry: 'funnel_page' }]]);
  assert.deepEqual(fun.dl, [{ event: 'cta_telegram', entry: 'funnel_page' }]);
});

test('ladder.js still sends to Metrika and now also to dataLayer for GA4 via GTM', async () => {
  const b = browser({ selectors: ['#capabilities'], lang: 'ru', pathname: '/ru/' });
  b.win.dataLayer = [];
  b.run(await read('assets/ladder.js'));
  assert.equal(b.calls[0][2], 'ladder_1_landing');
  assert.equal(b.win.dataLayer[0].event, 'ladder_1_landing');
  assert.equal(b.win.dataLayer[0].entry, 'direct');
});
