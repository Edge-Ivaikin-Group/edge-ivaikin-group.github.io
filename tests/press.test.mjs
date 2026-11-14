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
});
