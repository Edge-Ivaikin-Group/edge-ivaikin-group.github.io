import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {test} from 'node:test';

const root = new URL('../', import.meta.url);
const pages = [['en', 'partners/brand/'], ['ru', 'ru/partners/brand/']];
const assets = [
  'assets/brand/edge-logo-navy.svg',
  'assets/brand/edge-logo-gold.svg',
  'assets/brand/edge-logo-navy.png',
  'assets/brand/edge-logo-gold.png',
  'assets/brand/edge-logo-navy-master.png',
  'assets/brand/edge-logo-gold-master.png',
  'assets/brand/og.png'
];

function pngSize(buf) {
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

async function localTarget(href) {
  const path = href.split('#')[0].split('?')[0];
  if (!path.startsWith('/')) return null;
  const rel = path.replace(/^\//, '');
  return rel.endsWith('/') || rel === '' ? `${rel}index.html` : rel;
}

test('brand pages are self-canonical, paired and free of trackers or commission rates', async () => {
  for (const [lang, path] of pages) {
    const html = await readFile(new URL(path + 'index.html', root), 'utf8');
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.ok(html.includes(`rel="canonical" href="https://edgeivaikin.com/${path}"`));
    assert.match(html, /hreflang="en" href="https:\/\/edgeivaikin\.com\/partners\/brand\/"/);
    assert.match(html, /hreflang="ru" href="https:\/\/edgeivaikin\.com\/ru\/partners\/brand\/"/);
    assert.match(html, /property="og:image" content="https:\/\/edgeivaikin\.com\/assets\/brand\/og\.png"/);
    assert.match(html, /<img[^>]+alt="[^"]+"/);
    assert.doesNotMatch(html, /googletagmanager|mc\.yandex|<iframe|dataLayer|google-analytics/i);
    assert.doesNotMatch(html, /\d+\s*%/);
    assert.doesNotMatch(html, /commission[^<]{0,80}\d|комисси[^<]{0,80}\d/i);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    const nodes = blocks.flatMap((block) => block['@graph'] ?? [block]);
    const org = nodes.find((node) => node['@type'] === 'Organization');
    const page = nodes.find((node) => node['@type'] === 'WebPage');
    assert.equal(org.name, 'Edge Ecosystem');
    assert.equal(org.legalName, 'Общество с ограниченной ответственностью «ЭДЖ ЭКОСИСТЕМА»');
    assert.equal(org.url, 'https://edgeivaikin.com/');
    assert.equal(org.logo, 'https://edgeivaikin.com/assets/logo.png');
    assert.deepEqual(org.sameAs, ['https://www.linkedin.com/in/timothyivaikin/', 'https://t.me/TimothyIvaikin']);
    assert.equal(page.url, `https://edgeivaikin.com/${path}`);
    assert.equal(page.inLanguage, lang);
  }
});

test('sitemap lists both brand URLs and partner pages link to them', async () => {
  const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
  assert.ok(sitemap.includes('<loc>https://edgeivaikin.com/partners/brand/</loc>'));
  assert.ok(sitemap.includes('<loc>https://edgeivaikin.com/ru/partners/brand/</loc>'));
  assert.match(sitemap, /hreflang="en" href="https:\/\/edgeivaikin\.com\/partners\/brand\/"/);
  assert.match(sitemap, /hreflang="ru" href="https:\/\/edgeivaikin\.com\/ru\/partners\/brand\/"/);
  const en = await readFile(new URL('partners/index.html', root), 'utf8');
  const ru = await readFile(new URL('ru/partners/index.html', root), 'utf8');
  assert.ok(en.includes('href="/partners/brand/"'));
  assert.ok(ru.includes('href="/ru/partners/brand/"'));
  assert.ok(!en.includes('href="/ru/partners/brand/"'));
});

test('approved logo files exist, differ by color, and page links resolve', async () => {
  const files = new Map();
  for (const asset of assets) files.set(asset, await readFile(new URL(asset, root)));
  assert.notDeepEqual(files.get('assets/brand/edge-logo-navy.svg'), files.get('assets/brand/edge-logo-gold.svg'));
  assert.notDeepEqual(files.get('assets/brand/edge-logo-navy-master.png'), files.get('assets/brand/edge-logo-gold-master.png'));
  assert.match(files.get('assets/brand/edge-logo-navy.svg').toString('utf8'), /#174276/);
  assert.match(files.get('assets/brand/edge-logo-gold.svg').toString('utf8'), /#E2BF76/);
  assert.doesNotMatch(files.get('assets/brand/edge-logo-navy.svg').toString('utf8'), /#E2BF76/);
  assert.deepEqual(pngSize(files.get('assets/brand/edge-logo-navy.png')), [1600, 900]);
  assert.deepEqual(pngSize(files.get('assets/brand/edge-logo-gold.png')), [1600, 900]);
  assert.deepEqual(pngSize(files.get('assets/brand/edge-logo-navy-master.png')), [5568, 3132]);
  assert.deepEqual(pngSize(files.get('assets/brand/edge-logo-gold-master.png')), [5568, 3132]);
  assert.deepEqual(pngSize(files.get('assets/brand/og.png')), [1200, 630]);
  for (const [, path] of pages) {
    const html = await readFile(new URL(path + 'index.html', root), 'utf8');
    for (const href of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const target = await localTarget(href[1]);
      if (!target) continue;
      await stat(new URL(target, root));
    }
  }
  const summary = await readFile(new URL('llms.txt', root), 'utf8');
  assert.match(summary, /https:\/\/edgeivaikin\.com\/partners\/brand\//);
  assert.match(summary, /https:\/\/edgeivaikin\.com\/ru\/partners\/brand\//);
  assert.doesNotMatch(summary, /\d+\s*%/);
});
