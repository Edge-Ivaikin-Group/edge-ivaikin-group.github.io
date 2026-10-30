import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://edgeivaikin.com';

async function filesUnder(dir, extension) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'tests') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await filesUnder(full, extension));
    else if (entry.name.endsWith(extension)) out.push(full);
  }
  return out;
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(([, key, double, single]) => [key, (double ?? single).replaceAll('&amp;', '&')]));
}

test('local href and src targets, including fragments, exist', async () => {
  const htmlFiles = await filesUnder(root, '.html');
  const missing = [];
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const rel = path.relative(root, file);
    const basePath = '/' + path.relative(root, path.dirname(file)).replaceAll(path.sep, '/');
    const base = new URL((basePath === '/' ? '' : basePath) + '/', origin);
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id));
    for (const tag of html.matchAll(/<(?:a|link|script|img)\b[^>]*>/gi)) {
      const attrs = attributes(tag[0]);
      const value = attrs.href ?? attrs.src;
      if (!value || /^(?:mailto:|tel:|data:|javascript:)/.test(value) || value.startsWith('#')) {
        if (value?.startsWith('#')) {
          const id = decodeURIComponent(value.slice(1));
          if (id && !ids.has(id)) missing.push(`${rel} -> ${value}`);
        }
        continue;
      }
      if (/^https?:/.test(value) && !value.startsWith(origin)) continue;
      const url = new URL(value, base);
      if (url.origin !== origin) continue;
      let target = path.join(root, decodeURIComponent(url.pathname));
      try {
        const info = await stat(target);
        if (info.isDirectory()) target = path.join(target, 'index.html');
        assert.ok((await stat(target)).isFile());
      } catch {
        missing.push(`${rel} -> ${url.pathname}`);
        continue;
      }
      if (url.hash && target.endsWith('.html')) {
        const destination = await readFile(target, 'utf8');
        const destIds = new Set([...destination.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id));
        if (!destIds.has(decodeURIComponent(url.hash.slice(1)))) missing.push(`${rel} -> ${url.pathname}${url.hash}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('unprefixed /automation-ai/ redirects to the Russian page and is not linked as its own article', async () => {
  const redirect = await readFile(path.join(root, 'automation-ai/index.html'), 'utf8');
  assert.match(redirect, /rel="canonical" href="https:\/\/edgeivaikin\.com\/ru\/automation-ai\/"/);
  assert.match(redirect, /http-equiv="refresh" content="0; url=\/ru\/automation-ai\/"/);
  assert.match(redirect, /location\.replace\("\/ru\/automation-ai\/"\)/);
  assert.match(redirect, /name="robots" content="noindex"/);
  assert.match(redirect, /href="\/ru\/automation-ai\/"/);
  const htmlFiles = await filesUnder(root, '.html');
  for (const file of htmlFiles) {
    if (path.relative(root, file) === path.join('automation-ai', 'index.html')) continue;
    const html = await readFile(file, 'utf8');
    for (const tag of html.matchAll(/<(?:a|link)\b[^>]*>/gi)) {
      const href = attributes(tag[0]).href;
      if (!href || /^(?:mailto:|tel:|#)/.test(href)) continue;
      const url = new URL(href, origin + '/');
      if (url.origin === origin) assert.notEqual(url.pathname.replace(/\/$/, ''), '/automation-ai', path.relative(root, file));
    }
  }
});

test('contact goals and the mobile bar stay solid and measurable', async () => {
  const js = await readFile(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(js, /ym\(108284737,\s*"reachGoal",\s*goal\)/);
  assert.match(js, /dataLayer\.push\(\{\s*event:\s*goal\s*\}\)/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /max-width:\s*540px/);
  const css = await readFile(path.join(root, 'assets/landing.css'), 'utf8');
  const sticky = css.slice(css.indexOf('.landing .sticky-cta'));
  assert.ok(sticky.startsWith('.landing .sticky-cta'), 'sticky bar styles exist');
  assert.match(sticky, /env\(safe-area-inset-bottom/);
  assert.match(sticky, /max-width:\s*540px/);
  assert.match(sticky, /position:\s*fixed/);
  assert.match(sticky, /z-index:\s*40/);
  assert.match(sticky, /background:\s*#05060a/);
  assert.match(sticky, /min-height:\s*44px/);
  assert.doesNotMatch(sticky, /backdrop-filter/);
});
