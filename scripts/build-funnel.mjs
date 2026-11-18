// Generates the Hunt ladder funnel pages: /ladder/N/ (EN) and /ru/ladder/N/ (RU), N = 1..7.
// Static output is committed. Run: node scripts/build-funnel.mjs
// Copy comes only from text already published on this site (home pages, cases, pricing, FAQ).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://edgeivaikin.com';
const CALENDAR = 'https://calendar.app.google/4aFN841D87V6or7q9';
const TELEGRAM = 'https://t.me/TimothyIvaikin';
const BOT = 'https://t.me/EdgeExecuteBot';
const PHONE_HREF = 'tel:+79956573730';
const PHONE = '+7 995 657\u201137\u201130';

// The mail links are taken from the live home pages so the subject and the brief template stay identical.
async function mailto(file) {
  const html = await readFile(resolve(root, file), 'utf8');
  const m = html.match(/href="(mailto:hello@edgeivaikin\.com\?[^"]*)"/);
  if (!m) throw new Error('mailto not found in ' + file);
  return m[1];
}
const MAIL = { en: await mailto('index.html'), ru: await mailto('ru/index.html') };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const base = (lang, n) => (lang === 'ru' ? `/ru/ladder/${n}/` : `/ladder/${n}/`);
const home = (lang) => (lang === 'ru' ? '/ru/' : '/');

const T = {
  en: {
    htmlLang: 'en', locale: 'en',
    skip: 'Skip to content', brandLabel: 'Edge home', stepsLabel: 'Funnel steps', langLabel: 'Language switcher',
    stage: ['Start', 'The problem', 'The approach', 'Proof', 'Terms', 'Getting ready', 'Contact'],
    stepOf: (n) => `Step ${n} of 7`,
    next: (label) => `Next: ${label}`, discuss: 'Discuss your project', tgLine: 'Prefer to write now?', tgLink: 'Message us on Telegram',
    siteLink: 'About the company', back: 'Back to step',
    footerLead: 'Edge Ecosystem', company: 'Company details (RU)', press: 'Press & media',
    copy: '\u00a9 2026 Edge Ecosystem. All rights reserved.',
    pillLine: 'OOO \u201cEDGE ECOSYSTEM\u201d (LLC) \u00b7 INN 9707054215 \u00b7 Moscow',
  },
  ru: {
    htmlLang: 'ru', locale: 'ru_RU',
    skip: 'К содержанию', brandLabel: 'На главную Edge', stepsLabel: 'Шаги воронки', langLabel: 'Language switcher',
    stage: ['Начало', 'Задача', 'Подход', 'Опыт', 'Условия', 'Подготовка', 'Связь'],
    stepOf: (n) => `Шаг ${n} из 7`,
    next: (label) => `Дальше: ${label}`, discuss: 'Обсудить задачу', tgLine: 'Удобнее написать сразу?', tgLink: 'Написать в Telegram',
    siteLink: 'О компании', back: 'Назад к шагу',
    footerLead: 'Edge Ecosystem', company: 'Сведения о компании', press: 'Для СМИ',
    copy: '\u00a9 2026 Edge Ecosystem. Все права защищены.',
    pillLine: 'ООО \u201cЭДЖ ЭКОСИСТЕМА\u201d \u00b7 ИНН 9707054215 \u00b7 Москва',
  },
};

// Step content. Each entry: title (h1), lead, body (html), description (meta).
const C = {
  en: {
    1: {
      title: 'Data scattered, work duplicated, launch stuck?',
      lead: 'We build CRM, internal portals and integrations for teams held back by disconnected tools, manual work and stalled delivery.',
      body: `<div class="cards3">
        <div class="mini"><p class="situation">Customer data is scattered</p></div>
        <div class="mini"><p class="situation">The team duplicates work across systems</p></div>
        <div class="mini"><p class="situation">A launch is stuck between contractors</p></div>
      </div>
      <p class="hero-note">Start with the problem. No technical specification needed for the first conversation.</p>`,
    },
    2: {
      title: 'What kind of task people bring to us',
      lead: 'You can build a new system or connect the ones that already work. Start with the situation closest to yours.',
      body: `<div class="cards3">
        <div class="mini"><p class="situation">Customer data is scattered</p><h3>Platforms &amp; CRM</h3><p>CRM, portals, roles, processes, approvals, analytics.</p><div class="tagrow"><span class="tag">RBAC</span><span class="tag">Audit logs</span><span class="tag">Dashboards</span></div></div>
        <div class="mini"><p class="situation">The team duplicates work across systems</p><h3>Automation &amp; integrations</h3><p>APIs, events, bots, payment flows, synchronisation.</p><div class="tagrow"><span class="tag">API-first</span><span class="tag">ETL</span><span class="tag">Bots</span></div></div>
        <div class="mini"><p class="situation">A launch is stuck between contractors</p><h3>Reliability &amp; delivery</h3><p>CI/CD, monitoring, SRE practices, safe releases.</p><div class="tagrow"><span class="tag">CI/CD</span><span class="tag">Monitoring</span><span class="tag">SLA</span></div></div>
      </div>`,
    },
    3: {
      title: 'How the work is organised',
      lead: 'A simple ladder: prove value fast, then scale.',
      body: `<div class="split">
        <div><h2>Engagement model</h2>
          <div class="timeline">
            <div class="step"><div class="badge">1</div><div><b>Pilot MVP (2\u20136 weeks)</b><br/>Single metric, demo, and decision-ready artifact.</div></div>
            <div class="step"><div class="badge">2</div><div><b>Monthly retainer</b><br/>Roadmap + continuous delivery + measurable improvements.</div></div>
            <div class="step"><div class="badge">3</div><div><b>Productize</b><br/>Turn proven solutions into repeatable delivery for adjacent clients.</div></div>
          </div></div>
        <div><h2>Start with one business process</h2>
          <div class="timeline">
            <div class="step"><div class="badge">1</div><div><b>Describe the bottleneck</b><br/>What gets stuck, which systems are involved, and what needs to change.</div></div>
            <div class="step"><div class="badge">2</div><div><b>Define a bounded first stage</b><br/>Agree scope, dependencies, budget and acceptance criteria before development.</div></div>
            <div class="step"><div class="badge">3</div><div><b>Decide what to scale</b><br/>Review the delivered stage against the agreed criteria, then choose the next step.</div></div>
          </div></div>
      </div>
      <h2 class="sub">How delivery is run</h2>
      <p class="lead">Delivery that survives audits, hand-offs, and scale.</p>
      <div class="cards3">
        <div class="mini"><h3>Clear contracts</h3><p>Defined scope, SLAs, and deliverables.</p></div>
        <div class="mini"><h3>Clean IP hygiene</h3><p>Client-owned deliverables, repository discipline, access control.</p></div>
        <div class="mini"><h3>Transparent reporting</h3><p>Monthly numbers, docs, and evidence.</p></div>
      </div>`,
    },
    4: {
      title: 'What has already been delivered',
      lead: 'Each case explains the roles, the contribution and the outcome. Detailed references for enterprise and public-sector partners are available under NDA.',
      body: `<div class="cards2">
        <div class="mini"><p class="situation">2023\u20132024 \u00b7 Discover Culture, Saudi Arabia</p><h3>Cultural events and ticketing platform</h3>
          <p>Situation: the Ministry of Culture needed one place to discover cultural events and book tickets. Timothy Ivaikin took part in the development as technical lead.</p>
          <p>Outcome: on November 23, 2023, the ministry announced the platform\u2019s beta launch. Publications from 2023\u20132024 document its use for the Bienalsur exhibition in Riyadh and the Madinah Book Fair.</p>
          <p class="links"><a href="/cases/#discover-culture">Case and contribution</a> <a href="https://www.spa.gov.sa/en/N2002647" target="_blank" rel="noopener noreferrer">Saudi Press Agency announcement</a></p></div>
        <div class="mini"><p class="situation">Public sector \u00b7 client not disclosed</p><h3>Registration systems and regulatory portals</h3>
          <p>For an economic development programme the Edge team delivered software components for participant registration, digital compliance processes and regulatory portals.</p>
          <p class="links"><a href="/cases/regulatory-portal/">Read the case</a></p></div>
      </div>
      <p class="cta"><a class="btn" href="/cases/">All cases</a></p>`,
    },
    5: {
      title: 'Pricing and terms',
      lead: '\u201cFrom\u201d anchors. Final scope and cost are set after discovery.',
      body: `<div class="cards2">
        <div class="mini"><h3>Pilot MVP (2\u20136 weeks)</h3><p><b>from $25,000</b></p><p>Narrow scope, one clear metric, a demo that sells.</p></div>
        <div class="mini"><h3>Custom development &amp; integration</h3><p><b>from $100/hour</b></p><p>Teams on demand: platforms, CRM, APIs, integrations.</p></div>
        <div class="mini"><h3>Strategic IT consulting &amp; audit</h3><p><b>from $150/hour</b></p><p>Architecture, governance, systems and process audit.</p></div>
        <div class="mini"><h3>Support &amp; evolution</h3><p><b>from $3,500/month</b></p><p>SLA retainer: monitoring, releases, continuous delivery.</p></div>
      </div>
      <p class="hero-note">Pricing for the Russian market (\u20bd) is published on the <a href="/company/">Company details</a> page. Pilot timing depends on scope, access and integrations. The 2\u20136 week range is an estimate, not a fixed promise.</p>
      <h2 class="sub">Before we start</h2>
      <div class="faq">
        <details open><summary>Do we need a finished specification?</summary><p>No. Start with the current process, the systems involved and the result you want. Scope and dependencies are clarified before development.</p></details>
        <details open><summary>Can you work with our existing systems and team?</summary><p>Integration, platforms and delivery support are part of our services. Feasibility depends on system access, API limits and the responsibilities agreed with your team.</p></details>
        <details open><summary>What determines the price and timeline?</summary><p>Scope, integrations, data quality and acceptance requirements. The published prices are starting points; the final scope, cost and timeline are agreed separately.</p></details>
      </div>`,
    },
    6: {
      title: 'What to bring to the first conversation',
      lead: 'A short message is enough to start. Include these three points.',
      body: `<ol class="brief-prompts"><li>What is slowing the team down?</li><li>Which systems and people are involved?</li><li>What result do you need, and by when?</li></ol>
      <div class="split">
        <div><h2>What happens next</h2>
          <div class="timeline">
            <div class="step"><div class="badge">1</div><div><b>Describe the bottleneck</b><br/>What gets stuck, which systems are involved, and what needs to change.</div></div>
            <div class="step"><div class="badge">2</div><div><b>Define a bounded first stage</b><br/>Agree scope, dependencies, budget and acceptance criteria before development.</div></div>
            <div class="step"><div class="badge">3</div><div><b>Decide what to scale</b><br/>Review the delivered stage against the agreed criteria, then choose the next step.</div></div>
          </div></div>
        <div><h2>No specification needed</h2><p class="lead">Start with the current process, the systems involved and the result you want. Scope and dependencies are clarified before development.</p></div>
      </div>`,
    },
    7: {
      title: 'Tell us what needs to change',
      lead: 'A short message is enough to start. Include these three points.',
      body: `<ol class="brief-prompts"><li>What is slowing the team down?</li><li>Which systems and people are involved?</li><li>What result do you need, and by when?</li></ol>
      <div class="cta contact-primary">
        <a class="btn primary" href="${TELEGRAM}" target="_blank" rel="noopener">Message us on Telegram</a>
        <a class="btn" href="MAILTO">Email a short brief</a>
      </div>
      <p class="handoff-note">Opens a Telegram chat. Just send the 3 points above.</p>
      <p class="contact-alternative">Prefer a conversation?</p>
      <div class="cta contact-secondary">
        <a class="btn" href="${CALENDAR}" target="_blank" rel="noopener">Choose a time to talk</a>
        <a class="btn" href="${BOT}" target="_blank" rel="noopener">Telegram bot</a>
        <a class="btn" href="mailto:hello@edgeivaikin.com">hello@edgeivaikin.com</a>
        <a class="btn" href="${PHONE_HREF}">${PHONE}</a>
      </div>
      <p class="hero-note">For enterprise and public-sector partners: detailed references are available under NDA. Office: Moscow City, Federation Tower East, 35th floor.</p>`,
    },
  },
  ru: {
    1: {
      title: 'Данные разрознены, работа дублируется, запуск застрял?',
      lead: 'Создаём CRM, внутренние порталы и интеграции, когда данные разрознены, команда переносит их вручную, а запуск застрял между подрядчиками.',
      body: `<div class="cards3">
        <div class="mini"><p class="situation">Клиентские данные разрознены</p></div>
        <div class="mini"><p class="situation">Команда дублирует работу в разных системах</p></div>
        <div class="mini"><p class="situation">Запуск застрял между подрядчиками</p></div>
      </div>
      <p class="hero-note">Начните с проблемы. Готовое техническое задание для первого разговора не нужно.</p>`,
    },
    2: {
      title: 'С какой задачей к нам приходят',
      lead: 'Можно создать новую систему или связать уже работающие. Начните с ситуации, похожей на вашу.',
      body: `<div class="cards3">
        <div class="mini"><p class="situation">Клиентские данные разрознены</p><h3>Платформы &amp; CRM</h3><p>CRM, порталы, роли, процессы, согласования, аналитика.</p><div class="tagrow"><span class="tag">RBAC</span><span class="tag">Журналы аудита</span><span class="tag">Дашборды</span></div></div>
        <div class="mini"><p class="situation">Команда дублирует работу в разных системах</p><h3>Автоматизация &amp; интеграции</h3><p>API, события, боты, платежные потоки, синхронизации.</p><div class="tagrow"><span class="tag">API-first</span><span class="tag">ETL</span><span class="tag">Боты</span></div><p class="links"><a href="/ru/automation-ai/">Разобрать конкретный процесс</a></p></div>
        <div class="mini"><p class="situation">Запуск застрял между подрядчиками</p><h3>Надёжность &amp; поставка</h3><p>CI/CD, мониторинг, SRE-практики, безопасные релизы.</p><div class="tagrow"><span class="tag">CI/CD</span><span class="tag">Мониторинг</span><span class="tag">SLA</span></div><p class="links"><a href="/ru/anticrisis/">Антикризисное управление проектом</a></p></div>
      </div>
      <p class="links"><a href="/ru/insights/stalled-project/">Что проверить, если цифровой проект застрял</a></p>`,
    },
    3: {
      title: 'Как устроена работа',
      lead: 'Простая лестница: быстро доказать ценность, затем масштабировать.',
      body: `<div class="split">
        <div><h2>Модель работы</h2>
          <div class="timeline">
            <div class="step"><div class="badge">1</div><div><b>Пилотный MVP (2\u20136 недель)</b><br/>Одна метрика, демо, артефакт для решения.</div></div>
            <div class="step"><div class="badge">2</div><div><b>Ежемесячный ретейнер</b><br/>Роадмап + непрерывная поставка + измеримые улучшения.</div></div>
            <div class="step"><div class="badge">3</div><div><b>Продуктизация</b><br/>Проверенные решения \u2014 в повторяемую поставку для смежных отраслей.</div></div>
          </div></div>
        <div><h2>Начнём с одного бизнес-процесса</h2>
          <div class="timeline">
            <div class="step"><div class="badge">1</div><div><b>Разберём, что тормозит работу</b><br/>Как устроен процесс, какие системы задействованы и что должно измениться.</div></div>
            <div class="step"><div class="badge">2</div><div><b>Определим первый этап</b><br/>До разработки согласуем объём, зависимости, бюджет и критерии приёмки.</div></div>
            <div class="step"><div class="badge">3</div><div><b>Решим, что развивать дальше</b><br/>Проверим поставленный этап по согласованным критериям и определим следующий шаг.</div></div>
          </div></div>
      </div>
      <h2 class="sub">Как ведётся поставка</h2>
      <p class="lead">Поставка, которая выдерживает аудит, передачу и масштабирование.</p>
      <div class="cards3">
        <div class="mini"><h3>Понятные контракты</h3><p>Чёткий объём работ, SLA, результаты.</p></div>
        <div class="mini"><h3>Дисциплина интеллектуальной собственности</h3><p>Результаты \u2014 заказчику; порядок в репозиториях, контроль доступа.</p></div>
        <div class="mini"><h3>Прозрачная отчётность</h3><p>Ежемесячные цифры, документы, доказательства.</p></div>
      </div>`,
    },
    4: {
      title: 'Что уже сделано',
      lead: 'В карточках кейсов указаны роли, вклад и результаты. Детальные референсы для корпоративных и государственных партнёров \u2014 под NDA.',
      body: `<div class="cards2">
        <div class="mini"><p class="situation">2023\u20132024 \u00b7 Discover Culture, Саудовская Аравия</p><h3>Платформа культурных мероприятий и билетов</h3>
          <p>Задача: Министерству культуры нужна была единая площадка для поиска культурных мероприятий и оформления билетов. Тимофей Ивайкин участвовал в разработке как технический руководитель.</p>
          <p>Результат: 23 ноября 2023 года министерство объявило бета-запуск платформы. Публикации 2023\u20132024 годов документируют её использование для выставки Bienalsur в Эр-Рияде и книжной ярмарки в Медине.</p>
          <p class="links"><a href="/ru/cases/#discover-culture">Кейс и вклад</a> <a href="https://www.spa.gov.sa/en/N2002647" target="_blank" rel="noopener noreferrer">Объявление Saudi Press Agency</a></p></div>
        <div class="mini"><p class="situation">Госсектор \u00b7 заказчик не раскрывается</p><h3>Системы регистрации и регуляторные порталы</h3>
          <p>Для программы экономического развития команда Edge поставила программные компоненты для регистрации участников, цифровых процессов комплаенса и регуляторных порталов.</p>
          <p class="links"><a href="/ru/cases/regulatory-portal/">Читать кейс</a></p></div>
      </div>
      <p class="cta"><a class="btn" href="/ru/cases/">Все кейсы</a></p>`,
    },
    5: {
      title: 'Стоимость и условия',
      lead: 'Ориентиры \u00abот\u00bb \u2014 финальная стоимость по итогам discovery и оценки объёма.',
      body: `<div class="cards2">
        <div class="mini"><h3>Пилотный MVP (2\u20136 недель)</h3><p><b>от 1 500 000 \u20bd</b></p><p>Узкий скоуп, ясная метрика, демо и артефакты для решения.</p></div>
        <div class="mini"><h3>Заказная разработка и интеграция</h3><p><b>от 4 500 \u20bd/час</b></p><p>Команды под задачу: платформы, CRM, API, интеграции.</p></div>
        <div class="mini"><h3>Стратегический ИТ-консалтинг и аудит</h3><p><b>от 6 000 \u20bd/час</b></p><p>Архитектура, governance, аудит систем и процессов.</p></div>
        <div class="mini"><h3>Поддержка и развитие</h3><p><b>от 150 000 \u20bd/мес</b></p><p>Ретейнер с SLA: мониторинг, релизы, развитие.</p></div>
      </div>
      <p class="hero-note">Срок пилота зависит от объёма, доступов и интеграций. Диапазон 2\u20136 недель \u2014 ориентир, а не фиксированное обещание.</p>
      <div class="mini review"><h3>Есть КП подрядчика? Личный разбор перед утверждением бюджета \u2014 50 000 \u20bd</h3>
        <p>Помогаю собственнику разобраться, что компания получит за предложенный бюджет, какие обязательства стоит уточнить и как принимать результат. Изучаю одно коммерческое предложение с приложениями общим объёмом до 10 страниц, затем встреча на 60 минут и рекомендация на одной странице в течение одного рабочего дня после встречи.</p>
        <p class="hero-note">Для одного конкретного решения по CRM или автоматизации. Основной ориентир \u2014 проекты с бюджетом от 3 млн \u20bd и решением в ближайшие 30 дней. Подготовка начинается после оплаты и получения согласованных материалов.</p></div>
      <h2 class="sub">До начала работы</h2>
      <div class="faq">
        <details open><summary>Нужно ли готовое техническое задание?</summary><p>Нет. Для начала достаточно описать процесс, задействованные системы и нужный результат. Объём работ и зависимости уточняются до разработки.</p></details>
        <details open><summary>Можно работать с нашими системами и командой?</summary><p>Да, интеграции, платформы и поддержка поставки входят в наши услуги. Возможность подключения зависит от доступов, ограничений API и распределения ответственности с вашей командой.</p></details>
        <details open><summary>От чего зависят стоимость и сроки?</summary><p>От объёма работ, интеграций, качества данных и требований к приёмке. Указанные цены \u2014 ориентиры \u00abот\u00bb; итоговый объём, стоимость и сроки согласуются отдельно.</p></details>
      </div>`,
    },
    6: {
      title: 'Что подготовить к первому разговору',
      lead: 'Для начала достаточно короткого сообщения. Укажите три вещи.',
      body: `<ol class="brief-prompts"><li>Что сейчас тормозит работу?</li><li>Какие системы и люди участвуют?</li><li>Какой результат нужен и к какому сроку?</li></ol>
      <div class="split">
        <div><h2>Что будет дальше</h2>
          <div class="timeline">
            <div class="step"><div class="badge">1</div><div><b>Разберём, что тормозит работу</b><br/>Как устроен процесс, какие системы задействованы и что должно измениться.</div></div>
            <div class="step"><div class="badge">2</div><div><b>Определим первый этап</b><br/>До разработки согласуем объём, зависимости, бюджет и критерии приёмки.</div></div>
            <div class="step"><div class="badge">3</div><div><b>Решим, что развивать дальше</b><br/>Проверим поставленный этап по согласованным критериям и определим следующий шаг.</div></div>
          </div></div>
        <div><h2>Техническое задание не нужно</h2><p class="lead">Для начала достаточно описать процесс, задействованные системы и нужный результат. Объём работ и зависимости уточняются до разработки.</p></div>
      </div>`,
    },
    7: {
      title: 'Расскажите, что должно измениться',
      lead: 'Для начала достаточно короткого сообщения. Укажите три вещи.',
      body: `<ol class="brief-prompts"><li>Что сейчас тормозит работу?</li><li>Какие системы и люди участвуют?</li><li>Какой результат нужен и к какому сроку?</li></ol>
      <div class="cta contact-primary">
        <a class="btn primary" href="${TELEGRAM}" target="_blank" rel="noopener">Написать в Telegram</a>
        <a class="btn" href="MAILTO">Описать задачу по почте</a>
      </div>
      <p class="handoff-note">Откроется чат в Telegram. Можно сразу написать 3 пункта выше.</p>
      <p class="contact-alternative">Удобнее поговорить?</p>
      <div class="cta contact-secondary">
        <a class="btn" href="${CALENDAR}" target="_blank" rel="noopener">Выбрать время разговора</a>
        <a class="btn" href="${BOT}" target="_blank" rel="noopener">Telegram-бот</a>
        <a class="btn" href="mailto:hello@edgeivaikin.com">hello@edgeivaikin.com</a>
        <a class="btn" href="${PHONE_HREF}">${PHONE}</a>
      </div>
      <p class="hero-note">Для корпоративных и государственных партнёров: детальные референсы \u2014 под NDA. Офис: Москва-Сити, башня \u00abФедерация Восток\u00bb, 35 этаж.</p>`,
    },
  },
};

const HEAD_SCRIPTS = `  <script>window.edgeFunnelEntry="funnel_page";</script>
  <!-- Google Tag Manager (deferred) -->
  <script>window.dataLayer=window.dataLayer||[];
  function _loadGTM(){var w=window,d=document,s='script',l='dataLayer',i='GTM-WXMB3PPH';
  w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);}
  if('requestIdleCallback' in window){requestIdleCallback(_loadGTM)}else{addEventListener('load',_loadGTM)}</script>
  <!-- End Google Tag Manager -->
  <!-- Yandex.Metrika counter (deferred) -->
  <script>window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};
  function _loadYM(){(function(m,e,t,r,i,k,a){
  m[i].l=1*new Date();
  for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
  })(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
  ym(108284737,'init',{ssr:true,webvisor:true,clickmap:true,accurateTrackBounce:true,trackLinks:true});}
  if('requestIdleCallback' in window){requestIdleCallback(_loadYM)}else{addEventListener('load',_loadYM)}</script>
  <!-- /Yandex.Metrika counter -->`;

function render(lang, n) {
  const t = T[lang];
  const c = C[lang][n];
  const url = ORIGIN + base(lang, n);
  const other = lang === 'ru' ? 'en' : 'ru';
  const nextLabel = n < 7 ? t.stage[n] : '';
  const body = c.body.replace(/href="MAILTO"/g, `href="${esc(MAIL[lang]).replace(/&amp;amp;/g, '&amp;')}"`);
  const steps = t.stage.map((label, i) => {
    const k = i + 1;
    return `<a href="${base(lang, k)}"${k === n ? ' aria-current="step"' : ''}><span class="n">${k}</span><span class="l">${esc(label)}</span></a>`;
  }).join('');
  const nextBlock = n < 7
    ? `<a class="btn primary" href="${base(lang, n + 1)}">${esc(t.next(nextLabel))}</a>
        <a class="btn" href="${base(lang, 7)}" data-ladder-contact>${esc(t.discuss)}</a>`
    : `<a class="btn" href="${home(lang)}">${esc(t.siteLink)}</a>`;
  const tg = n < 7 ? `<p class="hero-note">${esc(t.tgLine)} <a href="${TELEGRAM}" target="_blank" rel="noopener">${esc(t.tgLink)}</a></p>` : '';
  const desc = c.lead;
  return `<!doctype html>
<html lang="${t.htmlLang}" dir="ltr">
<head>
  <meta charset="utf-8"/>
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <title>${esc(c.title)} | Edge Ecosystem</title>
  <meta name="description" content="${esc(desc)}"/>
  <meta name="robots" content="noindex">
  <meta name="theme-color" content="#05060a"/>
  <link rel="canonical" href="${url}"/>
  <link rel="alternate" hreflang="${other}" href="${ORIGIN + base(other, n)}"/>
  <link rel="alternate" hreflang="${t.htmlLang}" href="${url}"/>
  <link rel="stylesheet" href="/assets/styles.css"/>
  <link rel="stylesheet" href="/assets/landing.css"/>
  <link rel="stylesheet" href="/assets/funnel.css"/>
${HEAD_SCRIPTS}
</head>
<body class="bg-grid landing funnel" data-funnel-step="${n}">
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WXMB3PPH" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<noscript><div><img src="https://mc.yandex.ru/watch/108284737" style="position:absolute; left:-9999px;" alt=""></div></noscript>
<a class="skip-link" href="#main">${esc(t.skip)}</a>
<header>
  <div class="container nav">
    <a class="brand" href="${home(lang)}" aria-label="${esc(t.brandLabel)}"><img class="brand-logo" src="/assets/brand/edge-logo-gold-header.svg" width="135" height="28" alt="Edge"></a>
    <nav class="funnel-steps" aria-label="${esc(t.stepsLabel)}">${steps}</nav>
    <div class="lang" aria-label="${t.langLabel}">
      <a class="${lang === 'en' ? 'active' : ''}" href="${base('en', n)}">EN</a>
      <a class="${lang === 'ru' ? 'active' : ''}" href="${base('ru', n)}">RU</a>
    </div>
  </div>
</header>

<main id="main">
  <section class="section funnel-step" id="step-${n}" data-ladder-stage>
    <div class="container">
      <p class="hero-eyebrow">${esc(t.stepOf(n))} \u00b7 ${esc(t.stage[n - 1])}</p>
      <h1>${esc(c.title)}</h1>
      <p class="lead">${esc(c.lead)}</p>
      ${n === 7 ? '' : body}
    </div>
  </section>
${n === 7 ? `  <section class="section" id="contact">
    <div class="container">
      ${body}
    </div>
  </section>
` : ''}  <section class="section funnel-next">
    <div class="container">
      <div class="cta">
        ${nextBlock}
      </div>
      ${tg}
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container">
    <div class="row">
      <div>
        <div class="pill">${esc(t.pillLine)}</div>
        <div style="margin-top:10px">${esc(t.copy)}</div>
      </div>
      <div>
        <div><a href="/company/">${esc(t.company)}</a></div>
        <div style="margin-top:8px"><a href="${lang === 'ru' ? '/ru/press/' : '/press/'}">${esc(t.press)}</a></div>
      </div>
    </div>
  </div>
</footer>
<script src="/assets/goals.js" defer></script>
<script src="/assets/ladder-funnel.js" defer></script>
</body>
</html>
`;
}

for (const lang of ['en', 'ru']) {
  for (let n = 1; n <= 7; n++) {
    const file = resolve(root, base(lang, n).slice(1), 'index.html');
    await mkdir(dirname(file), { recursive: true });
    // House style for these pages: no \u0451 (\u0451 -> \u0435).
    await writeFile(file, render(lang, n).replace(/\u0451/g, '\u0435').replace(/\u0401/g, '\u0415'));
  }
}
console.log('funnel pages written: 14');
