import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

test('channel note: constant, RU and EN homepages only, link in the HTML matches the constant', async () => {
  const js = await read('assets/channel.js');
  const url = js.match(/var CHANNEL_URL = "([^"]+)"/)[1];
  assert.equal(url, 'https://t.me/timothy_ivaikin_ru');
  const expectations = { 'ru/index.html': 'Telegram-канал', 'index.html': 'Telegram channel' };
  for (const [file, label] of Object.entries(expectations)) {
    const html = await read(file);
    const match = html.match(/<p class="channel-note"[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(match, `${file}: note present`);
    const link = match[1].match(/<a data-channel-link href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    assert.equal(link[1], url);
    assert.equal(link[2], label);
    assert.ok(html.includes('<script src="/assets/channel.js" defer></script>'));
    assert.ok(html.indexOf('class="channel-note"') > html.indexOf('id="contact"'), 'inside the contact section');
    assert.ok(html.includes('t.me/TimothyIvaikin'), 'personal Telegram contact is unchanged');
  }
  for (const file of ['zh/index.html', 'ar/index.html', 'company/index.html', 'deck/index.html']) {
    assert.ok(!(await read(file)).includes('channel-note'), `${file}: no channel note`);
  }
});
