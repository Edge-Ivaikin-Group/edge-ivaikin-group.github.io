import assert from 'node:assert/strict';
import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const required = [
  {rel: 'icon', href: '/assets/favicon.svg', type: 'image/svg+xml'},
  {rel: 'icon', href: '/assets/favicon-32.png', type: 'image/png', sizes: '32x32'},
  {rel: 'icon', href: '/assets/favicon-16.png', type: 'image/png', sizes: '16x16'},
  {rel: 'apple-touch-icon', href: '/assets/apple-touch-icon.png', sizes: '180x180'},
];

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(([, key, double, single]) => [key, double ?? single]));
}

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await htmlFiles(full));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

function pngSize(buf) {
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

test('every HTML page references the on-canon favicon set and the files exist', async () => {
  const files = await htmlFiles(root);
  assert.ok(files.length >= 14, 'expected the public HTML pages');
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const links = [...html.matchAll(/<link\b([^>]*)>/gi)].map((match) => attributes(match[1]));
    const icons = links.filter((link) => link.rel === 'icon' || link.rel === 'apple-touch-icon');
    assert.equal(icons.length, required.length, `${path.relative(root, file)} favicon links`);
    for (const need of required) {
      assert.ok(icons.some((link) => Object.entries(need).every(([key, value]) => link[key] === value)),
        `${path.relative(root, file)} missing ${need.href}`);
    }
    assert.ok(!icons.some((link) => link.href?.includes('logo.svg')), `${path.relative(root, file)} still uses logo.svg as the favicon`);
  }
  const svg = await readFile(path.join(root, 'assets/favicon.svg'), 'utf8');
  assert.match(svg, /#174276/);
  assert.match(svg, /#E2BF76/);
  assert.match(svg, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(svg, /#00e5ff|#a855f7|gradient/i);
  assert.deepEqual(pngSize(await readFile(path.join(root, 'assets/favicon-16.png'))), [16, 16]);
  assert.deepEqual(pngSize(await readFile(path.join(root, 'assets/favicon-32.png'))), [32, 32]);
  assert.deepEqual(pngSize(await readFile(path.join(root, 'assets/apple-touch-icon.png'))), [180, 180]);
  for (const asset of ['assets/favicon.svg', 'assets/favicon-16.png', 'assets/favicon-32.png', 'assets/apple-touch-icon.png', 'favicon.ico']) {
    assert.ok((await stat(path.join(root, asset))).size > 0, asset);
  }
  const ico = await readFile(path.join(root, 'favicon.ico'));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
  for (const pngName of ['assets/favicon-16.png', 'assets/favicon-32.png']) {
    const png = await readFile(path.join(root, pngName));
    assert.ok(ico.includes(png), `${pngName} is embedded in /favicon.ico`);
  }
  for (const page of ['ru/automation-ai/index.html', 'ru/insights/team-rhythm/index.html']) {
    assert.match(await readFile(path.join(root, page), 'utf8'), /src="\/assets\/brand\/edge-logo-navy-header\.svg"/);
  }
});
