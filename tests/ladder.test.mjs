import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const PAGES = ['index.html', 'ru/index.html', 'zh/index.html', 'ar/index.html', 'ru/automation-ai/index.html'];

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

const linkEvent = (href) => ({ target: { closest: (s) => (s.startsWith('a') ? { getAttribute: () => href } : null) } });
const HOME = ['#capabilities', '#model', '#proof', '#history', '#sovereign', '#enterprise', '#pricing', '#questions', '#contact'];

test('ladder: script is loaded on every funnel page, after goals.js, deferred', async () => {
  for (const f of PAGES) {
    const html = await read(f);
    const g = html.indexOf('<script src="/assets/goals.js" defer></script>');
    const l = html.indexOf('<script src="/assets/ladder.js" defer></script>');
    assert.ok(g > 0 && l > g, f);
    assert.equal(html.split('/assets/ladder.js').length, 2, f);
  }
});

test('ladder: stage selectors exist in the markup of each page', async () => {
  const src = await read('assets/ladder.js');
  const home = ['#capabilities', '#model', '#proof', '#pricing', '#contact'];
  for (const f of ['index.html', 'ru/index.html', 'zh/index.html', 'ar/index.html']) {
    const html = await read(f);
    for (const sel of home) assert.ok(html.includes(`id="${sel.slice(1)}"`), `${f} ${sel}`);
    assert.ok(html.includes('href="#contact"'), `${f} anchor`);
  }
  const lead = await read('ru/automation-ai/index.html');
  for (const needle of ['id="examples"', 'class="signal-strip"', 'lead-section', 'id="lead-form"']) assert.ok(lead.includes(needle), needle);
  assert.ok(src.includes('"#capabilities"'));
});

test('ladder: events fire in ladder order with lang, variant and entry params; each once', async () => {
  const src = await read('assets/ladder.js');
  const b = browser({ selectors: HOME, lang: 'ru', edgeAbHero: 'B', referrer: 'https://yandex.ru/search?q=x', pathname: '/ru/' });
  b.run(src);
  for (const s of ['#capabilities', '#model', '#proof', '#pricing']) b.see(s);
  b.fire('click', linkEvent('#contact'));
  b.fire('click', linkEvent('https://calendar.app.google/4aFN841D87V6or7q9'));
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_2_problem', 'ladder_3_solution', 'ladder_4_proof', 'ladder_5_offer', 'ladder_6_intent', 'ladder_7_conversion']);
  const first = b.calls[0];
  assert.equal(first[0], 108284737);
  assert.deepEqual(first[3], { lang: 'ru', ab_hero: 'B', page: '/ru/', entry: 'search' });
  assert.equal(b.calls.find((c) => c[2] === 'ladder_7_conversion')[3].channel, 'calendar');
  // repeats do nothing
  b.see('#capabilities');
  b.fire('click', linkEvent('mailto:hello@edgeivaikin.com'));
  assert.equal(b.goals().length, 7);
});

test('ladder: a direct contact click implies intent first; soft links do not count', async () => {
  const src = await read('assets/ladder.js');
  const b = browser({ selectors: HOME });
  b.run(src);
  b.fire('click', linkEvent('https://t.me/timothy_ivaikin_ru'));
  b.fire('click', linkEvent('https://www.linkedin.com/in/timothyivaikin/'));
  b.fire('click', linkEvent('/files/x.pdf'));
  b.fire('click', linkEvent('#capabilities'));
  assert.deepEqual(b.goals(), ['ladder_1_landing']);
  b.fire('click', linkEvent('https://t.me/TimothyIvaikin'));
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_6_intent', 'ladder_7_conversion']);
  assert.equal(b.calls.at(-1)[3].channel, 'telegram');
});

test('ladder: ab_hero is "none" without the test; direct entry; paid and campaign entries', async () => {
  const src = await read('assets/ladder.js');
  let b = browser({ selectors: HOME });
  b.run(src);
  assert.deepEqual(b.calls[0][3], { lang: 'en', ab_hero: 'none', page: '/', entry: 'direct' });
  b = browser({ selectors: HOME, search: '?utm_source=a&utm_medium=cpc' });
  b.run(src);
  assert.equal(b.calls[0][3].entry, 'paid');
  b = browser({ selectors: HOME, search: '?utm_source=tg' });
  b.run(src);
  assert.equal(b.calls[0][3].entry, 'campaign');
  b = browser({ selectors: HOME, referrer: 'https://t.me/x' });
  b.run(src);
  assert.equal(b.calls[0][3].entry, 'messenger');
  b = browser({ selectors: HOME, referrer: 'https://edgeivaikin.com/ru/' });
  b.run(src);
  assert.equal(b.calls[0][3].entry, 'internal');
  for (const c of b.calls) assert.ok(!JSON.stringify(c[3]).includes('http'));
});

test('ladder: a section that leaves the view before the dwell time does not count', async () => {
  const src = await read('assets/ladder.js');
  const b = browser({ selectors: HOME });
  b.run(src);
  const o = b.observers[0];
  o.cb([{ target: b.els['#proof'], isIntersecting: true }]);
  o.cb([{ target: b.els['#proof'], isIntersecting: false }]);
  b.timers.filter((t) => t.live && !t.every).forEach((t) => t.fn());
  assert.deepEqual(b.goals(), ['ladder_1_landing']);
  b.see('#proof');
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_4_proof']);
});

test('ladder: aux events for scroll and visible time', async () => {
  const src = await read('assets/ladder.js');
  const b = browser({ selectors: HOME });
  b.run(src);
  b.win.scrollY = 1300; // (1300+800)/4000 = 52%
  b.fireWin('scroll');
  b.win.scrollY = 2900; // 92%
  b.fireWin('scroll');
  const tick = b.timers.find((t) => t.every);
  for (let i = 0; i < 29; i++) tick.fn();
  assert.ok(!b.goals().includes('ladder_aux_time_30s'));
  b.doc.visibilityState = 'hidden';
  tick.fn(); tick.fn();
  assert.ok(!b.goals().includes('ladder_aux_time_30s'));
  b.doc.visibilityState = 'visible';
  tick.fn();
  assert.deepEqual(b.goals().filter((g) => g.startsWith('ladder_aux')), ['ladder_aux_scroll_50', 'ladder_aux_scroll_90', 'ladder_aux_time_30s']);
});

test('ladder: lead form page maps its own sections; form start is intent, valid submit is conversion', async () => {
  const src = await read('assets/ladder.js');
  const b = browser({ selectors: ['#lead-form', '.signal-strip', '#examples', 'section.fit', 'section.method', 'section.lead-section', 'section.faq'], lang: 'ru', pathname: '/ru/automation-ai/' });
  b.run(src);
  for (const s of ['.signal-strip', 'section.method', 'section.lead-section']) b.see(s);
  b.fire('focusin', { target: { tagName: 'INPUT', closest: (s) => (s === '#lead-form' ? {} : null) } });
  b.fire('submit', { target: { tagName: 'FORM' } });
  assert.deepEqual(b.goals(), ['ladder_1_landing', 'ladder_2_problem', 'ladder_3_solution', 'ladder_5_offer', 'ladder_6_intent', 'ladder_7_conversion']);
  assert.equal(b.calls.at(-1)[3].channel, 'form');
});

test('ladder: Telegram hand-off counts only for a valid form', async () => {
  const src = await read('assets/ladder.js');
  const mk = (valid) => {
    const b = browser({ selectors: ['#lead-form'] });
    b.els['#lead-form'].checkValidity = () => valid;
    b.run(src);
    b.fire('click', { target: { closest: (s) => (s === '#telegram-copy' ? {} : null) } });
    return b.goals();
  };
  assert.deepEqual(mk(false), ['ladder_1_landing']);
  assert.deepEqual(mk(true), ['ladder_1_landing', 'ladder_6_intent', 'ladder_7_conversion']);
});

test('ladder: new visit window, repeat in the same visit and blocked storage', async () => {
  const src = await read('assets/ladder.js');
  const b = browser({ selectors: HOME });
  b.run(src);
  const saved = b.store.edge_ladder_v1;
  assert.ok(saved);
  // second page of the same visit: landing is not counted again
  const b2 = browser({ selectors: HOME });
  b2.store.edge_ladder_v1 = saved;
  b2.run(src);
  assert.deepEqual(b2.goals(), []);
  // after 31 minutes it is a new visit
  const b3 = browser({ selectors: HOME });
  b3.store.edge_ladder_v1 = JSON.stringify({ ladder_1_landing: Date.now() - 31 * 60 * 1000 });
  b3.run(src);
  assert.deepEqual(b3.goals(), ['ladder_1_landing']);
  const b4 = browser({ selectors: HOME, sessionThrows: true });
  b4.run(src);
  b4.fire('click', linkEvent('mailto:a@b.c'));
  b4.fire('click', linkEvent('mailto:a@b.c'));
  assert.deepEqual(b4.goals(), ['ladder_1_landing', 'ladder_6_intent', 'ladder_7_conversion']);
});

test('ladder: safe without ym, without IntersectionObserver', async () => {
  const src = await read('assets/ladder.js');
  let b = browser({ selectors: HOME, ym: false });
  b.run(src);
  b.fire('click', linkEvent('mailto:a@b.c'));
  b = browser({ selectors: HOME, io: false });
  b.run(src);
  assert.deepEqual(b.goals(), ['ladder_1_landing']);
});

test('ladder: link classification stays identical to goals.js', async () => {
  const ladder = await read('assets/ladder.js');
  const goals = await read('assets/goals.js');
  const links = ['mailto:a@b.c', 'tel:+79956573730', 'https://calendar.app.google/x', 'https://wa.me/1', 'https://api.whatsapp.com/send', 'https://t.me/TimothyIvaikin', 'https://t.me/EdgeExecuteBot', 'https://t.me/timothy_ivaikin_ru', 'https://t.me/+abc', 'https://t.me/joinchat/abc', 'https://www.linkedin.com/in/x', 'https://x.com/a/file.pdf', 'https://example.com/', '#contact', '/ru/', 'javascript:void(0)'];
  const classify = (src, expr) => {
    const out = [];
    const ctx = { window: { location: { href: 'https://edgeivaikin.com/' }, ym() {} }, document: { addEventListener() {}, querySelector: () => null, documentElement: { getAttribute: () => 'en' } }, URL, Object, JSON, Date, out };
    runInNewContext(src.replace(/\}\)\(\);\s*$/, expr + '})();'), ctx);
    return ctx.out;
  };
  const g = classify(goals, `var L=${JSON.stringify(links)};for(var i=0;i<L.length;i++)out.push(goalForLink({getAttribute:function(){return L[i]}}));`);
  const l = classify(ladder, `var L=${JSON.stringify(links)};for(var i=0;i<L.length;i++)out.push(channelForLink({getAttribute:function(){return L[i]}}));`);
  const map = { cta_email: 'email', cta_calendar: 'calendar', cta_whatsapp: 'whatsapp', cta_telegram: 'telegram', cta_bot: 'bot' };
  links.forEach((href, i) => {
    const expected = href.startsWith('tel:') ? 'phone' : (map[g[i]] || '');
    assert.equal(l[i], expected, href);
  });
});
