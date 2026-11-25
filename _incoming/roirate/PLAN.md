# Roirate «Антикризис 2026» - план выпуска 27.11.2026

Основание: «Да regarding roirate», Тимофей, 25.11.2026 08:15 МСК (через Michael · CEO), карточка https://edgefocus.ru/tasks/31620.
Объем «да»: 2 GitHub PR + SMM 27.11; прод-деплой разрешен только для контента Roirate. Без рассылки в СМИ (так сформулировано в #31620).
Роль: «участвовал в практической части (симуляции работы системы)» - формулировка из вопроса #31620, принята. Слово «спикер» не используется. Второго человека у флипчарта не подписываем.
Исходный пакет: /workspace/roirate-workshop-2026-11-24/ (аудит, черновики 24.11).

## 1. Два PR (GitHub pull requests, НЕ пресс-рассылка) - делает облачный агент
Деплой: оба сайта - GitHub Pages из main (без workflows), т.е. мерж в main = выкладка в прод через 1-3 мин.

### PR-1 Ivajkin/ivaikin.com (main ec1bb7b, не менялся с 19.11)
- scripts/build-press.mjs: перевести с жестко зашитого slug `corporate-culture-2026-11-13` на `articles` по slug {eventDate, publishedDate, ru[], en[]}; страница «Корпоративной культуры» должна остаться побайтно прежней (кроме списка архива).
- content/press.json: новая запись первой в news/newsDeck/newsDate/archiveURLs/archiveURLsRU (texts/site-archive-entries.md, блок ivaikin.com + строки «ФИНАЛ newsDeck»).
- Релиз RU/EN: /ru/press/roirate-antikrizis-2026-11-13/ и /press/roirate-antikrizis-2026-11-13/ + TXT (texts/site-press-release-ru-en.md). Дата публикации 27.11.2026.
- Фото 01 в релиз (images/01-portrait.jpg, без EXIF), подпись «Тимофей Ивайкин на конференции «Антикризис 2026». Фото: Roirate».
- Блог RU: /ru/blog/antikrizis-produkt-2026/ по образцу ru/blog/ai-enterprise-projects/, карточка в ru/blog/index.html, sitemap.xml (texts/site-blog-ru.md; фото 02 в тексте, 01 - обложка).
- Положить фото по стабильным путям для SMM: /assets/press/roirate-antikrizis-2026-11-13-01.jpg и -02.jpg (нужны публичные URL для загрузки в Postiz/X).
- `npm run build && npm test`; staging-превью; проверить с телефона.
### PR-2 Edge-Ivaikin-Group/edge-ivaikin-group.github.io (main 08b35dd, 23.11)
- Тот же рефакторинг build-press.mjs (скрипт там тоже зашит на corporate-culture).
- content/press.json: запись «Основатель Edge Ecosystem на конференции Roirate «Антикризис 2026»» RU/EN со ссылкой на релиз на ivaikin.com (полный текст не дублировать).
- Без insights-статьи (по плану - опционально, не включено в «да»).

Порядок: PR открыть 25-26.11, превью проверить до 26.11 20:00 МСК; мерж обоих 27.11 в 09:00 МСК; проверка 200 + мобильный вид в 09:15; посты с 10:00.
Если к 09:45 27.11 релиз/блог не отдают 200 - в постах ссылку заменить на https://roirate.ru/product-ecology-workshop, публикацию не сдвигать.

## 2. SMM 27.11.2026
| Время МСК | Канал | Текст | Фото | Маршрут | Статус |
|---|---|---|---|---|---|
| 10:00 | Telegram @timothy_ivaikin_ru (RU) | texts/telegram-ru.txt (718 зн., ссылка на блог) | images/01-portrait.jpg | Mac, Telegram 2.app (skill telegram-channel-post-from-mac): либо нативная отложка после деплоя-превью, либо публикация в 10:00; проверка через t.me/.../?embed=1 | не запланировано |
| 10:00 (07:00 UTC) | LinkedIn личный «Timothy Ivaikin» (EN) | texts/linkedin-en.txt (без ссылки) | 01 + 02 | Postiz cmvuf7h6q44r7or1cf0y7606s, type=schedule | не запланировано: Postiz принимает фото только по публичному URL, файлов нет онлайн до мержа PR-1 |
| 10:30 | X @TimothyIvaikin (EN) | texts/x-en.txt (276 из 280 с t.co) | 02 | коннектор X create_posts в 10:30 (отложки в коннекторе нет; X не подключен в Postiz) | не запланировано |
LinkedIn-страница Edge - не используем (личный сюжет). Медиа-рассылки нет.
Пересечений: тай-чи клипы в Telegram 26.11 и 28.11 в 11:00, 27.11 свободно. LinkedIn: в Postiz на 27.11 ничего нет (проверено 25.11 08:20 МСК).

## 3. Правила (проверено по текстам)
Нет «спикер»/«выступил»/«эксперт»; нет цифр аудитории, отзывов, клиентов, выручки; нет Прогресс/SFIT; без «ё» и длинных тире. Названы только организатор ROIRATE и Никита Балашов (благодарность организатору, есть в одобренном пакете). Фото только 01/02 с «Фото: Roirate».
