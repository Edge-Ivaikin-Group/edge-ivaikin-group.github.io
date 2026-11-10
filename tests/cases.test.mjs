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

test('each locale identifies the shared portfolio and includes the Techno Media archive', async () => {
  for (const locale of locales) {
    const page = await read(`${locale}cases/index.html`);
    assert.match(page, /<h1 id="portfolio-title">/);
    assert.ok(page.includes('href="#techno-media"'));
    assert.ok(page.includes('id="techno-media"'));
    assert.ok(page.includes('id="habcluster"'));
    assert.ok(page.includes('id="repair-crsa"'));
    assert.ok(page.includes('id="oil-internships"'));
    const internship = page.match(/<article id="oil-internships"[\s\S]*?<\/article>/)?.[0];
    assert.ok(internship?.includes('2014'));
    assert.ok(internship?.includes('src="/assets/cases/techno-media-internship-certificate-2014.webp"'));
    assert.ok(internship?.includes('src="/assets/cases/techno-media-refinery-equipment-certificate-2014.webp"'));

    assert.ok(page.includes('id="inventory-service-design"'));
    assert.ok(page.includes('id="tm-business-analytics"'));
    for (const id of ['hotel-booking', 'freight-intake-design', 'broker-operations-platforms', 'white-label-agent-crm']) {
      assert.ok(page.includes(`id="${id}"`));
    }
    const furniture = page.match(/<article id="furniture-mobile-store"[\s\S]*?<\/article>/)?.[0];
    assert.match(furniture ?? '', /Android[\s\S]*APK/);
    const cards = [...page.matchAll(/<article id="[^"]+" class="case-card">([\s\S]*?)<\/article>/g)];
    assert.equal(cards.length, 99);
    for (const [, card] of cards) {
      assert.match(card, /class="case-credit">[^<]+<\/p>/);
      assert.ok((card.match(/<dt>/g) ?? []).length >= 1);
    }
  }
});

test('the regulatory portal case preserves both legacy anchors and exposes both indexed editions', async () => {
  const domain = 'https://edgeivaikin.com';
  const enPath = '/cases/regulatory-portal/';
  const ruPath = '/ru/cases/regulatory-portal/';
  const sitemap = await read('sitemap.xml');
  const llms = await read('llms.txt');
  const titles = [];
  for (const [lang, path, portfolio] of [['en', enPath, '/cases/'], ['ru', ruPath, '/ru/cases/']]) {
    const index = await read(`${portfolio.slice(1)}index.html`);
    const card = index.match(/<article id="regulatory-portal"[\s\S]*?<\/article>/)?.[0];
    assert.ok(card?.includes(`href="${path}"`), 'legacy anchor leads to its localized story');
    const page = await read(`${path.slice(1)}index.html`);
    assert.ok(page.includes(`<html lang="${lang}"`));
    titles.push(page.match(/<title>(.+)<\/title>/)?.[1]);
    assert.ok(page.includes(`rel="canonical" href="${domain}${path}"`));
    for (const [alternate, target] of [['en', enPath], ['ru', ruPath], ['x-default', enPath]]) {
      assert.ok(page.includes(`hreflang="${alternate}" href="${domain}${target}"`));
    }
    assert.ok(page.includes(`href="${portfolio}#regulatory-portal"`));
    assert.ok(sitemap.includes(`<loc>${domain}${path}</loc>`));
    assert.ok(llms.includes(`(${domain}${path})`));
    const article = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)[1]);
    assert.equal(article['@type'], 'Article');
    assert.equal(article.inLanguage, lang);
    assert.equal(article.mainEntityOfPage, domain + path);
    const imagePath = new URL(article.image).pathname;
    assert.ok((await readFile(new URL(imagePath.slice(1), root))).length < 150_000);
    assert.match(page, /<figcaption>[^<]+<\/figcaption>/);
  }
  assert.ok(titles.every(Boolean));
  assert.notEqual(...titles);
});
