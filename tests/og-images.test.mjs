import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

function pngSize(buf) {
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

const pages = {
  'index.html': 'og-home-en-v2.png',
  'ru/index.html': 'og-home-ru-v2.png',
  'zh/index.html': 'og-home-zh-v2.png',
  'ar/index.html': 'og-home-ar-v2.png',
  'edge/index.html': 'og-home-ru-v2.png',
  'company/index.html': 'og-home-ru-v2.png',
  'partners/index.html': 'og-home-en-v2.png',
  'ru/partners/index.html': 'og-home-ru-v2.png',
  'deck/index.html': 'og-home-en-v2.png',
  'offer/ternovsky-pm/index.html': 'og-home-en-v2.png',
};

test('home link-preview images are 1200x630 and replace the placeholder', async () => {
  for (const file of new Set(Object.values(pages))) {
    const buf = await readFile(new URL(`assets/og/${file}`, root));
    assert.deepEqual(pngSize(buf), [1200, 630]);
  }
  for (const [page, file] of Object.entries(pages)) {
    const html = await readFile(new URL(page, root), 'utf8');
    const url = `https://edgeivaikin.com/assets/og/${file}`;
    assert.ok(html.includes(`property="og:image" content="${url}"`), page);
    assert.ok(html.includes('property="og:image:width" content="1200"'), page);
    assert.ok(html.includes('property="og:image:height" content="630"'), page);
    assert.ok(html.includes('property="og:image:alt" content="'), page);
    assert.ok(html.includes(`name="twitter:image" content="${url}"`), page);
    assert.ok(!html.includes('/assets/og.png"'), page);
  }
  const company = await readFile(new URL('company/index.html', root), 'utf8');
  const title = company.match(/<title>([^<]+)<\/title>/)[1];
  const description = company.match(/name="description" content="([^"]+)"/)[1];
  assert.ok(company.includes(`property="og:title" content="${title}"`));
  assert.ok(company.includes(`property="og:description" content="${description}"`));
  const script = await readFile(new URL('scripts/render-og.mjs', root), 'utf8');
  const copy = [...script.matchAll(/(?:lines|proof): \[([^\]]+)\]/g)].map((match) => match[1]).join('\n');
  assert.doesNotMatch(copy, /sovereign|суверен/i);
  assert.match(script, /'Edge gets stalled'/);
  assert.match(script, /'Edge доводит'/);
  assert.match(script, /'CRM · portals · integrations'/);
  assert.match(script, /'CRM · порталы · интеграции'/);
});
