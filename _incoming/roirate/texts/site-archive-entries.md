# Черновик 1. Запись в архив мероприятий (ivaikin.com и edgeivaikin.com)

Статус: ФИНАЛ (одобрено Тимофеем 25.11.2026 08:15 МСК, #31620). Вариант B роли применен. Ничего не опубликовано.
Формат: точная структура `content/press.json` обоих сайтов (раздел «Релизы и материалы» / «Новости и материалы об основателе» играет роль архива мероприятий). Новая запись идет первой в массивах `news`, `newsDeck`, `newsDate`, `archiveURLs(RU)`.

Роль: применен вариант B (участие в практической части - симуляции работы системы), одобрен в #31620. newsDeck ниже в JSON заменить на строки «ФИНАЛ newsDeck».

## ivaikin.com - `content/press.json`

```json
{
  "archiveURLs":   ["/press/roirate-antikrizis-2026-11-13/", "/press/corporate-culture-2026-11-13/", "/en/recognition/nasledie-mira-2026/"],
  "archiveURLsRU": ["/ru/press/roirate-antikrizis-2026-11-13/", "/ru/press/corporate-culture-2026-11-13/", "/ru/recognition/nasledie-mira-2026/"],
  "locales": {
    "ru": {
      "news":     ["Конференция Roirate «Антикризис 2026» в Сколково", "..."],
      "newsDeck": ["Участие 13 ноября 2026 года в конференции о решениях при неопределенности: спрос, бюджет, люди, системы и ИИ.", "..."],
      "newsDate": ["Событие: 13.11.2026 · Публикация: 27.11.2026", "..."]
    },
    "en": {
      "news":     ["Roirate Anti-Crisis 2026 conference in Skolkovo", "..."],
      "newsDeck": ["Attended on 13 November 2026: a conference on decisions under uncertainty - demand, budgets, people, systems and AI.", "..."],
      "newsDate": ["Event: 13 Nov 2026 · Published: 27 Nov 2026", "..."]
    }
  }
}
```

ФИНАЛ newsDeck RU (ivaikin.com): «Участие 13 ноября 2026 года в конференции о решениях при неопределенности и в практической части - симуляции работы системы.»
ФИНАЛ newsDeck EN (ivaikin.com): "Attended on 13 November 2026 and took part in the hands-on systems simulation."

## edgeivaikin.com - `content/press.json`

Ссылка ведет на релиз на ivaikin.com (полный текст не дублируем, как и в записи о «Корпоративной культуре»).

```json
{
  "locales": {
    "ru": {
      "news":     ["Основатель Edge Ecosystem на конференции Roirate «Антикризис 2026»", "Участие в интенсиве о корпоративной культуре в Москве"],
      "newsDeck": ["13 ноября 2026 года, БЦ «Стратос», Сколково. Темы: проверка спроса, распределение бюджета, решения при неопределенности, люди, системы и ИИ.", "..."],
      "newsDate": ["Событие: 13.11.2026 · Публикация: 27.11.2026", "..."]
    },
    "en": {
      "news":     ["Edge Ecosystem founder at Roirate's Anti-Crisis 2026 conference", "Corporate Culture intensive in Moscow"],
      "newsDeck": ["13 November 2026, Stratos business centre, Skolkovo. Topics: demand validation, budget allocation, decisions under uncertainty, people, systems and AI.", "..."],
      "newsDate": ["Event: 13 Nov 2026 · Published: 27 Nov 2026", "..."]
    }
  },
  "archiveURLs":   ["https://ivaikin.com/press/roirate-antikrizis-2026-11-13/", "..."],
  "archiveURLsRU": ["https://ivaikin.com/ru/press/roirate-antikrizis-2026-11-13/", "..."]
}
```

## Карточка события (общая для обоих сайтов, если позже появится отдельная страница «Мероприятия»)

| Поле | RU | EN |
|---|---|---|
| Событие | Конференция Roirate «Антикризис 2026. Как получить прибыль в период нестабильности» | Roirate Anti-Crisis 2026: How to Stay Profitable in Unstable Times |
| Дата | 13 ноября 2026 | 13 November 2026 |
| Место | БЦ «Стратос», Сколково, Москва | Stratos business centre, Skolkovo, Moscow |
| Организатор | ROIRATE | ROIRATE |
| Роль | Участник участник практической части - симуляции работы системы | Attendee took part in the systems simulation |
| Темы | спрос, бюджет, повторные покупки, геймификация, люди, системы и ИИ | demand, budget, repeat purchases, gamification, people, systems and AI |
| Фото | `01-portrait-antikrizis-2026-IMG_7931.jpg`, подпись «Тимофей Ивайкин на конференции «Антикризис 2026». Фото: Roirate» | "Timothy Ivaikin at Anti-Crisis 2026. Photo: Roirate" |
| Источник | https://roirate.ru/product-ecology-workshop | same |

## Техническая заметка для PR

`scripts/build-press.mjs` в обоих репо зашит на один slug `corporate-culture-2026-11-13` и даты 13/14.11. Перед добавлением записи:
1. перевести `articles` на объект `{slug: {eventDate, publishedDate, ru: [...], en: [...]}}`;
2. генерировать страницу и TXT для каждого slug;
3. вынести `eventLabel` / `publishedLabel` в статью;
4. `npm run build && npm test`, проверить, что страница «Корпоративной культуры» не изменилась побайтно (кроме списка архива).
