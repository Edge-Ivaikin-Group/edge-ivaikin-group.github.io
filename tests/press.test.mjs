import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('company press rooms provide contacts, brand assets and distinct founder references in every language',async()=>{
 const paths={en:'press/',ru:'ru/press/',zh:'zh/press/',ar:'ar/press/'};
 for(const [lang,path]of Object.entries(paths)){
  const page=await read(path+'index.html');assert.match(page,new RegExp(`<html lang="${lang}"`));if(lang==='ar')assert.match(page,/dir="rtl"/);
  assert.ok(page.includes('https://edgeivaikin.com/'+path));assert.match(page,/mailto:hello@edgeivaikin\.com\?subject=/);assert.match(page,/partners\/brand\//);assert.match(page,/https:\/\/ivaikin.com\/(ru\/)?press\//);
  assert.match(page,/hreflang="en"/);assert.match(page,/hreflang="ar"/);
  const home=await read((lang==='en'?'':lang+'/')+'index.html');assert.ok(home.includes('href="/'+path+'"'));
  for(const forbidden of ['edgefocus.ru/tasks/','/Users/','since 2011','subsidiar'])assert.ok(!page.includes(forbidden),forbidden);
 }
 const en=await read('press/index.html'),ru=await read('ru/press/index.html');
 const card=html=>{const a=html.indexOf('<article class="press-news">');return html.slice(a,html.indexOf('</article>',a));};
 const enCard=card(en),ruCard=card(ru);
 assert.ok(enCard.includes('https://ivaikin.com/press/roirate-antikrizis-2026-11-13/'));
 assert.ok(enCard.includes('Edge Ecosystem founder at Roirate&#39;s Anti-Crisis 2026 conference'));
 assert.ok(enCard.includes('Event: 13 Nov 2026 · Published: 27 Nov 2026'));
 assert.ok(ruCard.includes('https://ivaikin.com/ru/press/roirate-antikrizis-2026-11-13/'));
 assert.ok(ruCard.includes('Основатель Edge Ecosystem на конференции Roirate «Антикризис 2026»'));
 assert.ok(ruCard.includes('Событие: 13.11.2026 · Публикация: 27.11.2026'));
 for(const text of [enCard,ruCard]){
  for(const forbidden of ['спикер','Прогресс','SFIT','ё','Ё','—','–'])assert.ok(!text.includes(forbidden),forbidden);
 }
 assert.ok(en.includes('https://ivaikin.com/press/corporate-culture-2026-11-13/'));
 assert.ok(ru.includes('https://ivaikin.com/ru/press/corporate-culture-2026-11-13/'));
 for(const path of ['zh/press/index.html','ar/press/index.html']){
  const page=await read(path);
  assert.ok(page.includes('https://ivaikin.com/press/corporate-culture-2026-11-13/'));
  assert.ok(!page.includes('roirate-antikrizis-2026-11-13'));
 }
 const build=await read('scripts/build-press.mjs');
 assert.ok(!build.includes('corporate-culture-2026-11-13'));
});
