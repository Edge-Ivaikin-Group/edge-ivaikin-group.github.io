import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const calendar = 'https://calendar.app.google/4aFN841D87V6or7q9';

function fakeButton() {
  const attrs = { href: '#contact', class: 'btn primary' };
  return {
    textContent: 'A', attrs, listeners: [],
    setAttribute(k, v) { attrs[k] = v; },
    getAttribute(k) { return attrs[k]; },
    addEventListener(t, fn) { this.listeners.push([t, fn]); },
  };
}

function run(source, { lang, stored, storageThrows = false, random = 0.9 }) {
  const button = fakeButton();
  const store = {};
  if (stored) store.edge_ab_hero = stored;
  const calls = [];
  const win = {
    ym: (...args) => calls.push(args),
    localStorage: {
      getItem: (k) => { if (storageThrows) throw new Error('blocked'); return store[k] ?? null; },
      setItem: (k, v) => { if (storageThrows) throw new Error('blocked'); store[k] = v; },
    },
  };
  const ctx = {
    window: win,
    document: {
      documentElement: { getAttribute: () => lang },
      querySelector: (sel) => (sel.includes('.hero') ? button : null),
    },
    Math: Object.assign(Object.create(Math), { random: () => random }),
  };
  runInNewContext(source, ctx);
  return { button, store, get calls() { return JSON.parse(JSON.stringify(calls)); } };
}

test('ab-hero: hero button in HTML stays variant A and the script is placed after the hero in / and /ru/', async () => {
  for (const file of ['index.html', 'ru/index.html']) {
    const html = await read(file);
    const hero = html.indexOf('<section class="hero"');
    const heroEnd = html.indexOf('</section>', hero);
    const tag = html.indexOf('<script src="/assets/ab-hero.js"></script>');
    assert.ok(tag > heroEnd, `${file}: script after hero`);
    assert.ok(tag < html.indexOf('id="capabilities"'), `${file}: script right after hero`);
    assert.match(html.slice(hero, heroEnd), /<a class="btn primary" href="#contact">/);
    assert.ok(html.includes(`href="${calendar}"`), `${file}: calendar link exists on the page`);
  }
  for (const file of ['zh/index.html', 'ar/index.html', 'company/index.html', 'ru/automation-ai/index.html']) {
    assert.ok(!(await read(file)).includes('ab-hero.js'), `${file}: not part of the test`);
  }
});

test('ab-hero: variant B goes straight to the calendar, A is untouched, variant is reported', async () => {
  const src = await read('assets/ab-hero.js');
  const b = run(src, { lang: 'ru', random: 0.9 });
  assert.equal(b.store.edge_ab_hero, 'B');
  assert.equal(b.button.textContent, 'Выбрать время для 20-минутного разговора');
  assert.equal(b.button.attrs.href, calendar);
  assert.deepEqual(b.calls[0], [108284737, 'params', { ab_hero: 'B' }]);
  const en = run(src, { lang: 'en', stored: 'B' });
  assert.equal(en.button.textContent, 'Book a 20-minute call');
  const a = run(src, { lang: 'ru', random: 0.1 });
  assert.equal(a.store.edge_ab_hero, 'A');
  assert.equal(a.button.textContent, 'A');
  assert.equal(a.button.attrs.href, '#contact');
  a.button.listeners[0][1]();
  assert.deepEqual(a.calls.at(-1), [108284737, 'reachGoal', 'hero_cta', { ab_hero: 'A' }]);
});

test('ab-hero: returning visitors keep their variant; blocked storage keeps the current button', async () => {
  const src = await read('assets/ab-hero.js');
  assert.equal(run(src, { lang: 'ru', stored: 'A', random: 0.9 }).button.textContent, 'A');
  const blocked = run(src, { lang: 'ru', storageThrows: true, random: 0.9 });
  assert.equal(blocked.button.attrs.href, '#contact');
  assert.equal(blocked.calls.length, 0);
});

test('ab-hero: FORCE flag forces A or B for everyone and is reported as forced', async () => {
  const src = await read('assets/ab-hero.js');
  assert.match(src, /var FORCE = null;/);
  const forcedA = run(src.replace('var FORCE = null;', 'var FORCE = "A";'), { lang: 'ru', stored: 'B' });
  assert.equal(forcedA.button.attrs.href, '#contact');
  assert.deepEqual(forcedA.calls[0], [108284737, 'params', { ab_hero: 'forced_A' }]);
  const forcedB = run(src.replace('var FORCE = null;', 'var FORCE = "B";'), { lang: 'en', stored: 'A' });
  assert.equal(forcedB.button.attrs.href, calendar);
});

test('ab-hero: harmless when ym is undefined', async () => {
  const src = await read('assets/ab-hero.js');
  const button = fakeButton();
  runInNewContext(src, {
    window: { localStorage: { getItem: () => 'B', setItem() {} } },
    document: { documentElement: { getAttribute: () => 'en' }, querySelector: () => button },
    Math,
  });
  assert.equal(button.textContent, 'Book a 20-minute call');
});
