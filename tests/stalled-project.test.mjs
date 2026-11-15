import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const path = '/ru/insights/stalled-project/';
const canonical = `https://edgeivaikin.com${path}`;

test('stalled-project article is indexed and leads to the existing paid diagnostic', async () => {
  const article = await read('ru/insights/stalled-project/index.html');
  const service = await read('ru/anticrisis/index.html');
  const related = await read('ru/insights/team-rhythm/index.html');
  assert.match(article, /<html lang="ru" dir="ltr">/);
  assert.ok(article.includes(`rel="canonical" href="${canonical}"`));
  assert.ok(article.includes('hreflang="ru"'));
  assert.ok(article.includes('href="/ru/anticrisis/#contact"'));
  assert.ok(service.includes(`href="${path}"`));
  assert.ok(related.includes(`href="${path}"`));
  assert.ok((await read('sitemap.xml')).includes(`<loc>${canonical}</loc>`));
  const json = JSON.parse(article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(json['@type'], 'Article');
  assert.equal(json.mainEntityOfPage, canonical);
  for (const banned of ['СФИТ', 'Тамчы', 'SFIT', 'Киргиз', 'Кыргыз', 'Центральная Азия', '50 млн']) {
    assert.ok(!article.includes(banned), `public article contains private token: ${banned}`);
  }
});
