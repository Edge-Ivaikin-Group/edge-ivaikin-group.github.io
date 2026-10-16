const ENDPOINT = 'https://edgefocus.ru/api/v1/public/partner-applications';
const SESSION_KEY = 'edge-partner-intake-v1';
const TRACKS = ['referral', 'delivery', 'technology'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIMITS = {name:120,company:160,email:254,telegram:64,role:100,portfolio_url:500,region:100,proposal:1200};
const ALLOWED = {utm_source:['edgefocus','edgeivaikin','ivaikin','telegram','linkedin','direct'],utm_medium:['website','organic_social'],utm_campaign:['edge-partners-202610'],utm_content:['hero','page','footer','apply']};
const clean = value => String(value ?? '').trim();

export function parseAttribution(search = '') {
  const params = new URLSearchParams(search);
  return Object.fromEntries(Object.entries(ALLOWED).flatMap(([key, values]) => values.includes(params.get(key)) ? [[key,params.get(key)]] : []));
}
export function initialTrack(search = '') {
  const track = new URLSearchParams(search).get('track');
  return TRACKS.includes(track) ? track : 'referral';
}
export function navigationQuery(search = '',track = initialTrack(search)) {
  const params=new URLSearchParams(parseAttribution(search));
  if (TRACKS.includes(track)) params.set('track',track);
  if (new URLSearchParams(search).get('qa')==='1') params.set('qa','1');
  return '?'+params.toString();
}
export function validateFields(fields) {
  if (!TRACKS.includes(fields.track)) return 'track';
  for (const [key, max] of Object.entries(LIMITS)) {
    if (['name','company','email','region','proposal'].includes(key) && !clean(fields[key])) return key;
    if ([...clean(fields[key])].length > max) return key;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(fields.email))) return 'email';
  if (clean(fields.portfolio_url)) {
    try {const url=new URL(clean(fields.portfolio_url)); if (!['https:','http:'].includes(url.protocol) || url.username || url.password) return 'portfolio_url';}
    catch {return 'portfolio_url';}
  }
  if (fields.consent !== true) return 'consent';
  return null;
}

// Only the retry identity and opening time survive reload. No form values are stored.
export function createIntake({storage,fetch:request=globalThis.fetch,uuid=()=>crypto.randomUUID(),now=Date.now,sourceUrl,utm={},endpoint=ENDPOINT}) {
  let attempt;
  try {const saved=JSON.parse(storage?.getItem(SESSION_KEY) || 'null'); if (UUID.test(saved?.key) && Number.isFinite(saved.startedAt) && saved.startedAt>0) attempt=saved;} catch { /* Storage may be unavailable. */ }
  if (!attempt) attempt={key:uuid(),startedAt:now()};
  let pending=false;
  let frozen=null;
  let receipt=null;
  return {
    async submit(fields) {
      if (receipt) return receipt;
      if (pending) return {state:'pending'};
      if (!frozen) {
        const invalid=validateFields(fields);
        if (invalid) return {state:'invalid',field:invalid};
        frozen={idempotency_key:attempt.key,track:fields.track,...Object.fromEntries(Object.keys(LIMITS).map(key=>[key,clean(fields[key])])),consent_policy:'partner-intake-v1',source_url:sourceUrl,utm:{utm_source:'edgeivaikin',utm_medium:'website',...parseAttribution(new URLSearchParams(utm).toString())},website:clean(fields.website),started_at_ms:attempt.startedAt};
      }
      try {storage?.setItem(SESSION_KEY,JSON.stringify(attempt));} catch { /* Current-page retries still preserve identity. */ }
      pending=true;
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),20000);
      try {
        const response=await request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',body:JSON.stringify(frozen),signal:controller.signal});
        if (response.status===201) {
          const body=await response.json();
          if (body.status==='received' && /^[a-f0-9]{32}$/.test(body.application_id)) {
            receipt={state:'received',applicationId:body.application_id};
            frozen=null;
            try {storage?.removeItem(SESSION_KEY);} catch { /* Receipt is already confirmed. */ }
            return receipt;
          }
          return {state:'uncertain'};
        }
        if (response.status===400 || response.status===422) {frozen=null; return {state:'invalid'};}
        if (response.status===409) return {state:'conflict'};
        if (response.status===429) return {state:'limited'};
        return {state:'uncertain'};
      } catch {return {state:'uncertain'};}
      finally {clearTimeout(timeout);pending=false;}
    },
  };
}

export function setupPartnerForm(document,window) {
  const form=document.querySelector('#partner-form');
  if (!form) return;
  const controls=form.querySelector('fieldset');
  const button=form.querySelector('[type="submit"]');
  const status=document.querySelector('#partner-status');
  const ru=document.documentElement.lang==='ru';
  const text=ru ? {
    pending:'Отправляем заявку…', retry:'Повторить отправку', submit:'Отправить заявку',
    invalid:'Проверьте обязательные поля, длину текста и адрес сайта. Согласие необходимо для отправки.',
    uncertain:'Ответ сервера не получен. Заявка могла сохраниться. Повторите отправку: будут использованы тот же текст и ключ. Не создавайте новую заявку; при необходимости напишите нам по почте.',
    conflict:'Этот ключ уже связан с другим содержимым. Не создавайте новую заявку. Напишите нам по почте, чтобы уточнить получение.',
    limited:'Слишком много запросов. Подождите немного и повторите отправку с тем же ключом.',
    received:'Заявка получена. Номер: ', detail:'Это подтверждение получения, а не принятие в партнёрскую программу. Условия и следующий шаг обсуждаются отдельно.',
    unavailable:'Форма сейчас недоступна. Напишите нам по почте или в Telegram.',
  } : {
    pending:'Sending your application…',retry:'Retry submission',submit:'Send application',
    invalid:'Check the required fields, text lengths and website address. Consent is required to submit.',
    uncertain:'No server confirmation arrived. Your application may have been saved. Retry to send the same text and key. Do not create another application; contact us by email if needed.',
    conflict:'This key is already associated with different content. Do not create another application. Email us to check receipt.',
    limited:'Too many requests. Please wait a little and retry with the same key.',
    received:'Application received. Reference: ',detail:'This confirms receipt, not acceptance into the partner programme. Terms and the next step are agreed separately.',
    unavailable:'The form is currently unavailable. Please email us or use Telegram.',
  };
  let client;
  try {
    let storage; try {storage=window.sessionStorage;} catch { /* Private browser storage may be blocked. */ }
    client=createIntake({storage,sourceUrl:document.querySelector('link[rel="canonical"]').href,utm:parseAttribution(window.location.search),endpoint:form.dataset.endpoint || ENDPOINT});
  } catch {status.textContent=text.unavailable;return;}
  form.elements.track.value=initialTrack(window.location.search);
  controls.disabled=false;
  for (const link of document.querySelectorAll('.partner-track a[href^="?track="], .partner-languages a')) {
    const target=new URL(link.getAttribute('href'),window.location.href);
    target.search=navigationQuery(window.location.search,target.searchParams.get('track') || initialTrack(window.location.search));
    link.setAttribute('href',target.pathname+target.search+target.hash);
  }
  button.disabled=false;
  let locked=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if (button.disabled || (!locked && !form.reportValidity())) return;
    const fields=Object.fromEntries(new FormData(form));
    fields.consent=form.elements.consent.checked;
    button.disabled=true;controls.disabled=true;form.setAttribute('aria-busy','true');status.textContent=text.pending;
    const result=await client.submit(fields);
    form.removeAttribute('aria-busy');
    if (result.state==='received') {
      form.reset(); status.textContent=text.received+result.applicationId+'. '+text.detail;
      status.focus(); return;
    }
    locked=['uncertain','conflict','limited'].includes(result.state);
    controls.disabled=locked;
    button.disabled=result.state==='conflict';
    button.textContent=locked ? text.retry : text.submit;
    status.textContent=text[result.state] || text.invalid;
    if (result.field) form.elements[result.field]?.focus();
  });
  // No analytics or session replay on this form; qa=1 never changes submission behavior.
}
if (typeof document!=='undefined') setupPartnerForm(document,window);
