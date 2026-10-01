const MAX_ATTRIBUTION_LENGTH = 80;

function clean(value, max = 700) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function parseAttribution(search = '') {
  const params = new URLSearchParams(search);
  const pick = (key) => clean(params.get(key), MAX_ATTRIBUTION_LENGTH);
  return {
    source: pick('utm_source'),
    medium: pick('utm_medium'),
    campaign: pick('utm_campaign'),
    ref: pick('ref'),
  };
}

export function buildLeadMessage(fields, attribution = {}) {
  const source = [attribution.source, attribution.medium, attribution.campaign]
    .map((part) => clean(part, MAX_ATTRIBUTION_LENGTH))
    .filter(Boolean)
    .join(' / ');

  const lines = [
    'Здравствуйте, Тимофей! Хочу разобрать процесс.',
    '',
    `Меня зовут: ${clean(fields.name)}`,
    `Контакт: ${clean(fields.contact)}`,
    `Роль / бизнес: ${clean(fields.role)}`,
    `Что происходит сейчас: ${clean(fields.situation)}`,
    `Цена проблемы: ${clean(fields.impact)}`,
    `Что уже пробовали: ${clean(fields.tried) || 'не указано'}`,
  ];

  if (source) lines.push(`Источник: ${source}`);
  if (attribution.ref) lines.push(`Познакомил(а): ${clean(attribution.ref, MAX_ATTRIBUTION_LENGTH)}`);
  lines.push('', 'Готов(а) на 20-минутное проблемное интервью.');
  return lines.join('\n');
}

export function buildWhatsAppUrl(phone, message) {
  const normalized = String(phone).replace(/\D/g, '');
  const url = new URL(`https://wa.me/${normalized}`);
  url.searchParams.set('text', message);
  return url;
}

function formFields(form) {
  const data = new FormData(form);
  return Object.fromEntries(['name', 'contact', 'role', 'situation', 'impact', 'tried'].map((key) => [key, data.get(key) ?? '']));
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

export async function handoffToTelegram(message, { copy, open }) {
  open('https://t.me/TIMOTHYIVAIKIN');
  await copy(message);
}

function track(action, attribution) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'automation_ai_lead_handoff',
    action,
    source: attribution.source || 'direct',
    medium: attribution.medium || '',
    campaign: attribution.campaign || '',
  });
}

function setupForm() {
  const form = document.querySelector('#lead-form');
  const status = document.querySelector('#form-status');
  const telegramButton = document.querySelector('#telegram-copy');
  if (!form || !status || !telegramButton) return;

  const attribution = parseAttribution(window.location.search);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const message = buildLeadMessage(formFields(form), attribution);
    const url = buildWhatsAppUrl('79956573730', message);
    track('whatsapp_opened', attribution);
    window.open(url.toString(), '_blank', 'noopener');
    status.textContent = 'Открылось готовое сообщение. Проверьте его и нажмите «Отправить» в WhatsApp.';
  });

  telegramButton.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    const message = buildLeadMessage(formFields(form), attribution);
    try {
      await handoffToTelegram(message, {
        copy: copyText,
        open: (url) => window.open(url, '_blank', 'noopener'),
      });
      track('telegram_copied', attribution);
      status.textContent = 'Сообщение скопировано. Вставьте его в открывшийся Telegram-чат и отправьте.';
    } catch {
      status.textContent = 'Не удалось скопировать автоматически. Откройте Telegram по ссылке слева и напишите Тимофею.';
    }
  });
}

if (typeof document !== 'undefined') setupForm();
