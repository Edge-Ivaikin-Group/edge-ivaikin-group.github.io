import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const locales = ['', 'ru/', 'zh/', 'ar/'];
const read = (file) => readFile(new URL(file, root), 'utf8');

test('case pages are discoverable and present the same cases in every language', async () => {
  const sitemap = await read('sitemap.xml');
  const caseIds = (html) => [...html.matchAll(/<article id="([\w-]+)"/g)].map((match) => match[1]);
  const reference = caseIds(await read('cases/index.html'));
  assert.ok(reference.length > 3, 'the page goes beyond the three homepage examples');
  for (const locale of locales) {
    const path = `/${locale}cases/`;
    const page = await read(`${locale}cases/index.html`);
    const home = await read(`${locale}index.html`);
    assert.ok(home.includes(`href="${path}"`));
    assert.ok(home.includes('id="proof"'), 'existing proof links still work');
    assert.ok(sitemap.includes(`<loc>https://edgeivaikin.com${path}</loc>`));
    assert.ok(page.includes(`rel="canonical" href="https://edgeivaikin.com${path}"`));
    assert.deepEqual(caseIds(page), reference);
    for (const alternate of locales) {
      assert.match(page, new RegExp(`rel="alternate" hreflang="[^"]+" href="https://edgeivaikin\\.com/${alternate}cases/"`));
    }
  }
  assert.match(await read('ar/cases/index.html'), /<html lang="ar" dir="rtl">/);
});
