/**
 * Render 1200×630 link-preview PNGs from assets/og/template.html.
 *
 *   node scripts/render-og.mjs
 *
 * Needs Playwright (`playwright` resolvable from this repo or from
 * /tmp/qa-tools) and, for the committed look: Inter, Noto Naskh Arabic,
 * and WenQuanYi Micro Hei. Output lands in assets/og/.
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const template = resolve(root, 'assets/og/template.html');
const outDir = resolve(root, 'assets/og');

const cards = {
  en: {
    lang: 'en',
    dir: 'ltr',
    file: 'og-home-en-v2.png',
    lines: ['Edge gets stalled', 'digital projects', 'to an accepted result'],
    proof: ['CRM · portals · integrations', 'results with acceptance criteria'],
  },
  ru: {
    lang: 'ru',
    dir: 'ltr',
    file: 'og-home-ru-v2.png',
    lines: ['Edge доводит', 'застрявшие', 'цифровые проекты', 'до принятого результата'],
    proof: ['CRM · порталы · интеграции', 'результат с критериями приёмки'],
  },
  zh: {
    lang: 'zh',
    dir: 'ltr',
    file: 'og-home-zh-v2.png',
    lines: ['Edge 将停滞的', '数字化项目', '推进至已验收的结果'],
    proof: ['CRM · 门户 · 集成', '带验收标准的结果'],
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    file: 'og-home-ar-v2.png',
    lines: ['Edge يوصل المشاريع', 'الرقمية المتعثرة', 'إلى نتيجة مقبولة'],
    proof: ['CRM · بوابات · تكاملات', 'نتائج بمعايير القبول'],
  },
};

const SAFE = { left: 325, right: 875, top: 56, bottom: 574 };

function loadPlaywright() {
  const anchors = [
    resolve(root, 'package.json'),
    '/tmp/qa-tools/color-qa.mjs',
  ];
  for (const anchor of anchors) {
    if (!existsSync(anchor)) continue;
    try {
      return createRequire(anchor)('playwright');
    } catch {
      /* try the next install */
    }
  }
  throw new Error('playwright is not installed. Install it, then rerun node scripts/render-og.mjs');
}

function assertCopy(card) {
  const joined = [...card.lines, ...card.proof].join('\n');
  if (/sovereign|суверен/i.test(joined)) throw new Error(`${card.file} uses a forbidden word`);
  for (const line of [...card.lines, ...card.proof]) {
    const words = line.split(/\s+/).filter(Boolean);
    const cjk = (line.match(/\p{Script=Han}/gu) || []).length;
    if (cjk === 0 && words.length > 7) throw new Error(`${card.file} line has ${words.length} words: ${line}`);
  }
  const fold = (word) => word
    .replace(/[Ее]/g, 'E')
    .replace(/[Сс]/g, 'C')
    .replace(/[Мм]/g, 'M')
    .replace(/[Рр]/g, 'P');
  for (const word of joined.split(/[^\p{L}\p{N}]+/u)) {
    const folded = fold(word);
    if (!/^(Edge|CRM)$/i.test(folded)) continue;
    if ([...word].some((ch) => ch.charCodeAt(0) > 127)) {
      throw new Error(`${card.file} uses a Cyrillic look-alike in ${word}`);
    }
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
}

function withDots(line) {
  return escapeHtml(line).replaceAll(' · ', ' <span class="dot">·</span> ');
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
mkdirSync(outDir, { recursive: true });

for (const card of Object.values(cards)) {
  assertCopy(card);
  await page.goto(pathToFileURL(template).href);
  await page.evaluate(({ lang, dir }) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    const face = (file, weight, range) => {
      const rule = `@font-face{font-family:"Edge OG Sans";src:url("${file}");font-weight:${weight};font-style:normal;${range ? `unicode-range:${range};` : ''}}`;
      document.head.append(Object.assign(document.createElement('style'), { textContent: rule }));
    };
    face('file:///usr/share/fonts/truetype/macos/Inter-SemiBold.ttf', 600);
    face('file:///usr/share/fonts/truetype/macos/Inter-Medium.ttf', 500);
    face(
      'file:///usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf',
      600,
      'U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF',
    );
    face(
      'file:///usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
      '500 600',
      'U+2E80-9FFF,U+F900-FAFF',
    );
  }, card);
  await page.evaluate(({ lines, proof }) => {
    const br = (parts) => parts.map((line) => line).join('<br>');
    document.getElementById('headline').innerHTML = br(lines);
    document.getElementById('proof').innerHTML = br(proof);
  }, {
    lines: card.lines,
    proof: card.proof.map(withDots),
  });
  await page.evaluate(() => document.fonts.ready);
  const box = await page.evaluate(() => {
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
    };
    return {
      safe: rect(document.getElementById('safe')),
      headline: rect(document.getElementById('headline')),
      proof: rect(document.getElementById('proof')),
      logo: rect(document.querySelector('.logo')),
      domain: rect(document.querySelector('.domain')),
      font: getComputedStyle(document.getElementById('headline')).fontSize,
      headlineOverflow: document.getElementById('headline').scrollWidth - document.getElementById('headline').clientWidth,
      proofOverflow: document.getElementById('proof').scrollWidth - document.getElementById('proof').clientWidth,
    };
  });
  if (box.headlineOverflow > 1 || box.proofOverflow > 1) {
    throw new Error(`${card.file} text overflows its column ${JSON.stringify(box)}`);
  }
  const pieces = ['safe', 'headline', 'proof', 'logo', 'domain'];
  for (const name of pieces) {
    const r = box[name];
    const outside = r.left < SAFE.left - 1 || r.right > SAFE.right + 1 || r.top < SAFE.top - 1 || r.bottom > SAFE.bottom + 1;
    if (outside) {
      throw new Error(`${card.file} ${name} leaves the center safe area ${JSON.stringify(r)} font ${box.font}`);
    }
  }
  const file = resolve(outDir, card.file);
  await page.locator('.stage').screenshot({ path: file, type: 'png' });
  console.log(card.file, box.font, JSON.stringify(box.safe));
}

await browser.close();
