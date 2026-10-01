import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildLeadMessage,
  buildWhatsAppUrl,
  handoffToTelegram,
  parseAttribution,
} from '../ru/automation-ai/form.js';

test('parseAttribution keeps only bounded source values', () => {
  const result = parseAttribution('?utm_source=winjoy&utm_medium=networking&utm_campaign=problem_interviews&ref=Anna%20Ivanova');
  assert.deepEqual(result, {
    source: 'winjoy',
    medium: 'networking',
    campaign: 'problem_interviews',
    ref: 'Anna Ivanova',
  });
  assert.equal(parseAttribution('?utm_source=' + 'x'.repeat(300)).source.length, 80);
});

test('buildLeadMessage creates a concrete qualification brief with source', () => {
  const message = buildLeadMessage({
    name: 'Анна',
    contact: '@anna',
    role: 'налоговый бухгалтер',
    situation: 'клиенты поздно присылают документы',
    impact: 'два дня ручной работы ежемесячно',
    tried: 'напоминания в Telegram',
  }, { source: 'winjoy', medium: 'networking', campaign: 'problem_interviews', ref: '' });
  assert.match(message, /Меня зовут: Анна/);
  assert.match(message, /Что происходит сейчас: клиенты поздно присылают документы/);
  assert.match(message, /Цена проблемы: два дня ручной работы ежемесячно/);
  assert.match(message, /Источник: winjoy \/ networking \/ problem_interviews/);
});

test('buildWhatsAppUrl targets Timothy and encodes the brief', () => {
  const url = buildWhatsAppUrl('79956573730', 'Привет, Тимофей!\nТест');
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/79956573730');
  assert.equal(url.searchParams.get('text'), 'Привет, Тимофей!\nТест');
});

test('Telegram handoff opens synchronously before awaiting clipboard', async () => {
  const events = [];
  let releaseCopy;
  const copy = () => new Promise((resolve) => {
    events.push('copy-started');
    releaseCopy = () => { events.push('copy-finished'); resolve(); };
  });
  const open = (url) => events.push(`opened:${url}`);

  const pending = handoffToTelegram('brief', { copy, open });
  assert.deepEqual(events, ['opened:https://t.me/TIMOTHYIVAIKIN', 'copy-started']);
  releaseCopy();
  await pending;
  assert.deepEqual(events, ['opened:https://t.me/TIMOTHYIVAIKIN', 'copy-started', 'copy-finished']);
});
