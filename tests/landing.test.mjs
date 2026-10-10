import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://edgeivaikin.com';
const calendar = 'https://calendar.app.google/4aFN841D87V6or7q9';
const locales = [
  { file: 'index.html', lang: 'en', route: '/', dir: 'ltr' },
  { file: 'ru/index.html', lang: 'ru', route: '/ru/', dir: 'ltr' },
  { file: 'zh/index.html', lang: 'zh', route: '/zh/', dir: 'ltr' },
  { file: 'ar/index.html', lang: 'ar', route: '/ar/', dir: 'rtl' },
];

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(([, key, double, single]) => [key, (double ?? single).replaceAll('&amp;', '&')]));
}

function elements(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi'))]
    .map(([, attr, body]) => ({ attrs: attributes(attr), body }));
}

function section(html, id) {
  const result = elements(html, 'section').find(({ attrs }) => attrs.id === id);
  assert.ok(result, `missing #${id} section`);
  return result.body;
}

function plain(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

for (const locale of locales) {
  const html = await readFile(path.join(root, locale.file), 'utf8');

  test(`${locale.lang}: hero reaches the on-page brief and proof without JavaScript`, () => {
    const hero = elements(html, 'section').find(({ attrs }) => attrs.class?.split(/\s+/).includes('hero'));
    assert.ok(hero, 'hero is present');
    const links = elements(hero.body, 'a');
    const primary = links.filter(({ attrs }) => attrs.class?.split(/\s+/).includes('primary'));
    assert.equal(primary.length, 1, 'one primary action');
    assert.equal(primary[0].attrs.href, '#contact');
    assert.ok(plain(primary[0].body), 'primary link has an accessible name');
    assert.ok(links.some(({ attrs }) => attrs.href === '#proof'), 'proof is directly reachable');
    assert.doesNotMatch(hero.body, /data-scroll|onclick\s*=/i, 'hero uses native fragment navigation');
    section(html, 'contact');
    section(html, 'proof');
  });

  test(`${locale.lang}: contact opens a populated email draft and retains existing channels`, () => {
    const contact = section(html, 'contact');
    const links = elements(contact, 'a');
    const draft = links.find(({ attrs }) => attrs.href?.startsWith('mailto:') && attrs.class?.split(/\s+/).includes('primary'));
    assert.ok(draft, 'primary contact action is an email draft');
    const url = new URL(draft.attrs.href);
    assert.equal(url.pathname, 'hello@edgeivaikin.com');
    assert.ok(url.searchParams.get('subject')?.trim(), 'draft includes a subject');
    assert.ok((url.searchParams.get('body')?.trim().split(/\r?\n/).filter(Boolean).length ?? 0) >= 3,
      'draft includes a useful multi-line brief');
    const hrefs = new Set(links.map(({ attrs }) => attrs.href));
    for (const href of [calendar, 'https://t.me/TimothyIvaikin', 'https://t.me/EdgeExecuteBot', 'mailto:hello@edgeivaikin.com']) {
      assert.ok(hrefs.has(href), `existing contact channel retained: ${href}`);
    }
    assert.doesNotMatch(contact, /<form\b/i, 'contact does not imply an unimplemented form submission');
    for (const link of elements(html, 'a').filter(({ attrs }) => attrs.href === calendar)) {
      assert.doesNotMatch(plain(link.body), /(?:20|٢٠)\s*[‑–\-]?\s*(?:min|мин|分钟|دقيقة)/i,
        'calendar link must not promise an unverified 20-minute appointment');
    }
  });

  test(`${locale.lang}: FAQ is readable and operable with native HTML controls`, () => {
    const faq = section(html, 'questions');
    const details = elements(faq, 'details');
    assert.ok(details.length >= 3, 'the main buyer questions have answers');
    for (const { body } of details) {
      const summaries = elements(body, 'summary');
      assert.equal(summaries.length, 1, 'each disclosure has exactly one summary');
      assert.match(body.trim(), /^<summary\b/i, 'summary is the first disclosure child');
      assert.ok(plain(summaries[0].body), 'summary has an accessible name');
      assert.doesNotMatch(summaries[0].body, /<(?:a|button|input)\b/i, 'summary has no competing interactive control');
      assert.ok(plain(body.replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/i, '')), 'answer is present without script execution');
    }
  });

  test(`${locale.lang}: local links, assets and fragment targets resolve`, async () => {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
    assert.equal(ids.length, new Set(ids).size, 'IDs remain unique');
    const refs = [...html.matchAll(/<(?:a|link|script|img)\b[^>]*>/gi)].map(([tag]) => attributes(tag));
    for (const attrs of refs) {
      const value = attrs.href ?? attrs.src;
      if (!value || /^(?:mailto:|tel:|data:|https?:)/.test(value)) continue;
      assert.notEqual(value, '#', 'links have real destinations');
      if (value.startsWith('#')) {
        assert.ok(ids.includes(decodeURIComponent(value.slice(1))), `missing target ${value}`);
        continue;
      }
      const url = new URL(value, origin + locale.route);
      assert.ok(!url.pathname.startsWith('/order'), 'no link to an absent order flow');
      let target = path.join(root, decodeURIComponent(url.pathname));
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
      assert.ok((await stat(target)).isFile(), `missing local destination: ${value}`);
      if (url.hash && target.endsWith('.html')) {
        const destination = await readFile(target, 'utf8');
        assert.ok([...destination.matchAll(/\bid="([^"]+)"/g)].some(([, id]) => id === decodeURIComponent(url.hash.slice(1))),
          `missing cross-page target ${value}`);
      }
    }
  });

  test(`${locale.lang}: language, canonical and alternate-language routes stay correct`, () => {
    const document = attributes(html.match(/<html\b[^>]*>/i)[0]);
    assert.equal(document.lang, locale.lang);
    assert.equal(document.dir, locale.dir);
    const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => attributes(tag));
    assert.equal(links.find(({ rel }) => rel === 'canonical')?.href, origin + locale.route);
    const alternates = Object.fromEntries(links.filter(({ rel }) => rel === 'alternate').map(({ hreflang, href }) => [hreflang, href]));
    assert.deepEqual(alternates, {
      en: origin + '/', ru: origin + '/ru/', 'zh-Hans': origin + '/zh/', ar: origin + '/ar/', 'x-default': origin + '/',
    });
    const languageMenu = html.match(/<div\b[^>]*class="lang"[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(languageMenu, 'language switcher retained');
    assert.deepEqual(elements(languageMenu, 'a').map(({ attrs }) => attrs.href), ['/', '/ru/', '/zh/', '/ar/']);
  });

  test(`${locale.lang}: company identity, legal destinations and history citations remain available`, () => {
    const footer = elements(html, 'footer')[0]?.body;
    assert.ok(footer, 'legal footer retained');
    for (const identifier of ['9707054215', '1257700561590', '770701001', '127055', '62.01']) {
      assert.ok(plain(footer).includes(identifier), `legal identifier retained: ${identifier}`);
    }
    const hrefs = new Set(elements(footer, 'a').map(({ attrs }) => attrs.href));
    for (const href of ['/company/', '/deck/', 'tel:+79956573730', 'mailto:hello@edgeivaikin.com']) {
      assert.ok(hrefs.has(href), `legal/contact destination retained: ${href}`);
    }
    const sources = new Set(elements(section(html, 'history'), 'a').map(({ attrs }) => attrs.href));
    for (const href of [
      'https://www.spa.gov.sa/en/N2002647',
      'https://saudigazette.com.sa/article/638037/SAUDI-ARABIA/Discover-Culture-Ministry-launches-a-dynamic-hub-for-cultural-exploration',
      'https://www.arabnews.com/saudi-arabia/1st-contemporary-art-museum-inaugurated-in-riyadh-with-argentinian-bienalsur-show-2402716',
      'https://www.spa.gov.sa/en/N2145593',
    ]) assert.ok(sources.has(href), `history evidence retained: ${href}`);
  });
}

test('published pricing still gives the existing price anchors', async () => {
  for (const [file, prices] of [
    ['index.html', ['$25,000', '$100/hour', '$150/hour', '$3,500/month']],
    ['ru/index.html', ['1 500 000 ₽', '4 500 ₽/час', '6 000 ₽/час', '150 000 ₽/мес']],
  ]) {
    const html = await readFile(path.join(root, file), 'utf8');
    const pricing = plain(section(html, 'pricing'));
    for (const price of prices) assert.ok(pricing.includes(price), `${file} retains ${price}`);
  }
});
