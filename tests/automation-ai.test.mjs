import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const pagePath = path.join(root, 'ru', 'automation-ai', 'index.html');

async function page() {
  return readFile(pagePath, 'utf8');
}

test('evergreen page has canonical SEO metadata and no event branding in title or h1', async () => {
  const html = await page();
  assert.match(html, /<title>Автоматизация сложных бизнес-процессов и запуск AI-систем/);
  assert.match(html, /rel="canonical" href="https:\/\/edgeivaikin\.com\/ru\/automation-ai\/"/);
  assert.match(html, /<h1[^>]*>[^<]*Сложные процессы/);
  assert.doesNotMatch(html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '', /Win&Joy/i);
  assert.doesNotMatch(html.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? '', /Win&Joy/i);
});

test('page contains concrete situations and an honest contact handoff', async () => {
  const html = await page();
  assert.match(html, /бухгалтер/i);
  assert.match(html, /Telegram, Excel, CRM и 1С/i);
  assert.match(html, /несколькими подрядчиками/i);
  assert.match(html, /Откроется готовое сообщение/i);
  assert.match(html, /id="lead-form"/);
  assert.match(html, /name="consent"/);
});

test('page exposes structured Service and FAQ data for search and AI retrieval', async () => {
  const html = await page();
  assert.match(html, /"@type"\s*:\s*"Service"/);
  assert.match(html, /"@type"\s*:\s*"FAQPage"/);
  assert.match(html, /"@type"\s*:\s*"Person"/);
});

test('sitemap and Russian index link to the new permanent page', async () => {
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  const russian = await readFile(path.join(root, 'ru', 'index.html'), 'utf8');
  assert.match(sitemap, /https:\/\/edgeivaikin\.com\/ru\/automation-ai\//);
  assert.match(russian, /href="\/ru\/automation-ai\/"/);
});

test('page offers the verified short PDF from the same permanent route', async () => {
  const html = await page();
  const pdf = path.join(root, 'ru', 'automation-ai', 'timothy-ivaikin-automation-ai.pdf');
  assert.match(html, /href="\/ru\/automation-ai\/timothy-ivaikin-automation-ai\.pdf"/);
  const bytes = await readFile(pdf);
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.ok(bytes.length > 100_000);
});

test('lead form controls have labels and non-empty accessible names', async () => {
  const html = await page();
  for (const id of ['lead-name', 'lead-contact', 'lead-role', 'lead-situation', 'lead-impact', 'lead-tried', 'lead-consent']) {
    assert.match(html, new RegExp(`<label[^>]*for="${id}"`));
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /aria-live="polite"/);
});
