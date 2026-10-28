import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'tests') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

test('headers use the approved Edge master, not the gradient placeholder', async () => {
  for (const file of await htmlFiles(root)) {
    const html = await readFile(file, 'utf8');
    const rel = path.relative(root, file);
    assert.doesNotMatch(html, /<span class="logo"/, `${rel} still renders the gradient header mark`);
    assert.doesNotMatch(html, /src="\/assets\/logo\.svg"/, `${rel} still uses the gradient logo.svg`);
    if (/class="brand"/.test(html)) assert.match(html, /class="brand-logo" src="\/assets\/brand\/edge-logo-gold-header\.svg"/, rel);
  }
});

test('header logo files are solid approved colors with a tight canvas', async () => {
  for (const [color, hex, other] of [['navy', '#174276', '#E2BF76'], ['gold', '#E2BF76', '#174276']]) {
    const svg = await readFile(path.join(root, `assets/brand/edge-logo-${color}-header.svg`), 'utf8');
    assert.match(svg, /viewBox="390\.04 421\.11 1147\.37 237\.78"/);
    assert.ok(svg.includes(`fill="${hex}"`), color);
    assert.ok(!svg.includes(other), color);
    assert.doesNotMatch(svg, /gradient|#00e5ff|#a855f7/i, color);
  }
  for (const css of ['assets/styles.css', 'deck/styles.css']) {
    const text = await readFile(path.join(root, css), 'utf8');
    assert.doesNotMatch(text, /\.logo\{/, css);
    assert.match(text, /\.brand-logo\{display:block; width:auto; height:28px\}/, css);
  }
  const logoSvg = await readFile(path.join(root, 'assets/logo.svg'), 'utf8');
  const navy = await readFile(path.join(root, 'assets/brand/edge-logo-navy-header.svg'), 'utf8');
  assert.equal(logoSvg, navy, 'assets/logo.svg is the approved navy wordmark');
  assert.doesNotMatch(logoSvg, /gradient|#00e5ff|#a855f7/i);
  const logoPng = await readFile(path.join(root, 'assets/logo.png'));
  assert.equal(logoPng.readUInt32BE(16), 512);
  assert.equal(logoPng.readUInt32BE(20), 512);
  assert.equal(logoPng[24], 8, 'logo.png bit depth');
  assert.equal(logoPng[25], 2, 'logo.png is RGB, not the grayscale placeholder');
});
