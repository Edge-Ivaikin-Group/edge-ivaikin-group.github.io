import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
const root = new URL('../', import.meta.url);
const moduleUrl = new URL('assets/partners.js', root);
const valid = {track:'delivery',name:'Ada',company:'Example',email:'ada@example.org',telegram:'',role:'',portfolio_url:'https://example.org/',region:'Europe',proposal:'An existing integration project.',consent:true,website:''};
const id = '0123456789abcdef0123456789abcdef';
const key = '12345678-1234-4234-8234-123456789abc';
const storage = () => {const values = new Map(); return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k),values};};

test('partner intake module exists', async () => {
  assert.ok(await readFile(moduleUrl, 'utf8').catch(()=>''), 'partner form implementation is absent');
});
test('validates bounded fields, consent and safe URLs before a request', async () => {
  const {validateFields} = await import(moduleUrl);
  assert.equal(validateFields(valid), null);
  for (const fields of [{...valid,email:'bad'},{...valid,company:' '},{...valid,region:''},{...valid,proposal:'x'.repeat(1201)},{...valid,consent:false},{...valid,portfolio_url:'javascript:alert(1)'},{...valid,track:'admin'}]) assert.ok(validateFields(fields));
});
test('unknown response retries exact body with same key; stores no personal fields', async () => {
  const {createIntake} = await import(moduleUrl);
  const saved = storage(); const calls=[];
  const client = createIntake({storage:saved,uuid:()=>key,now:()=>123456,sourceUrl:'https://edgeivaikin.com/partners/',fetch:async(u,o)=>{calls.push(JSON.parse(o.body));if(calls.length===1)throw new Error('lost');return {status:201,json:async()=>({application_id:id,status:'received'})};}});
  assert.equal((await client.submit(valid)).state,'uncertain');
  assert.equal((await client.submit({...valid,proposal:'Edited after lost response'})).state,'received');
  assert.deepEqual(calls[0],calls[1]);
  assert.equal(calls[0].idempotency_key,key);
  assert.ok(!JSON.stringify([...saved.values]).includes('ada@example.org'));
  assert.equal(saved.values.size,0);
});
test('concurrent submits make one request and malformed success never confirms receipt', async () => {
  const {createIntake} = await import(moduleUrl);
  let resolve; let count=0;
  const client=createIntake({storage:storage(),uuid:()=>key,now:()=>123456,sourceUrl:'https://edgeivaikin.com/partners/',fetch:()=>{count++;return new Promise(r=>resolve=r);}});
  const first=client.submit(valid);
  assert.equal((await client.submit(valid)).state,'pending');
  resolve({status:201,json:async()=>({application_id:'bad',status:'received'})});
  assert.equal((await first).state,'uncertain'); assert.equal(count,1);
});
test('reload retains only retry key and starting time; attribution is allowlisted', async () => {
  const {createIntake,parseAttribution,initialTrack} = await import(moduleUrl);
  const saved=storage(); let body;
  const opts={storage:saved,uuid:()=>key,now:()=>123456,sourceUrl:'https://edgeivaikin.com/ru/partners/',fetch:async(u,o)=>{body=JSON.parse(o.body);throw new Error('lost');}};
  await createIntake(opts).submit(valid);
  await createIntake({...opts,uuid:()=>{throw new Error('must reuse');}}).submit(valid);
  assert.equal(body.idempotency_key,key);
  assert.deepEqual(Object.keys(JSON.parse([...saved.values.values()][0])).sort(),['key','startedAt']);
  assert.deepEqual(parseAttribution('?utm_source=ada@example.org&utm_medium=secret&utm_campaign=private&endpoint=https://evil.test'),{});
  assert.equal(initialTrack('?track=technology'),'technology'); assert.equal(initialTrack('?track=unknown'),'referral');
});
test('both pages have canonical form, native fallbacks, consent and no trackers', async () => {
  for (const [lang,path] of [['en','partners/'],['ru','ru/partners/']]) {
    const html=await readFile(new URL(path+'index.html',root),'utf8');
    assert.match(html,new RegExp(`<html lang="${lang}"`));
    assert.ok(html.includes(`rel="canonical" href="https://edgeivaikin.com/${path}"`));
    assert.match(html,/id="partner-form"/); assert.match(html,/name="consent"[^>]*required/);
    assert.match(html,/mailto:hello@edgeivaikin.com/); assert.match(html,/https:\/\/t.me\/TimothyIvaikin/);
    assert.doesNotMatch(html,/googletagmanager|mc.yandex|<iframe|dataLayer|guaranteed leads|гарантированные лиды/i);
    for (const name of ['name','company','email','region','proposal']) assert.match(html,new RegExp(`name="${name}"[^>]*required`));
    assert.match(html,/hreflang="en" href="https:\/\/edgeivaikin.com\/partners\/"/);
    assert.match(html,/hreflang="ru" href="https:\/\/edgeivaikin.com\/ru\/partners\/"/);
  }
});
test('safe campaign and QA labels survive track and language changes',async()=>{
  const {navigationQuery}=await import(moduleUrl);
  assert.equal(navigationQuery('?track=delivery&utm_source=telegram&utm_medium=organic_social&utm_campaign=edge-partners-202610&qa=1&email=private@example.org','technology'),'?utm_source=telegram&utm_medium=organic_social&utm_campaign=edge-partners-202610&track=technology&qa=1');
});
test('all corporate homepages discover the programme and sitemap contains both languages',async()=>{
  for(const [file,path] of [['index.html','/partners/'],['ru/index.html','/ru/partners/'],['zh/index.html','/partners/'],['ar/index.html','/partners/']]) assert.ok((await readFile(new URL(file,root),'utf8')).includes(`href="${path}"`));
  const sitemap=await readFile(new URL('sitemap.xml',root),'utf8');
  assert.ok(sitemap.includes('<loc>https://edgeivaikin.com/partners/</loc>'));
  assert.ok(sitemap.includes('<loc>https://edgeivaikin.com/ru/partners/</loc>'));
});
