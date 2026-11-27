import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const cfg=JSON.parse(await readFile(resolve(root,'content/press.json'),'utf8'));
const e=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const links=(group)=>Object.entries(group).map(([l,p])=>`<link rel="alternate" hreflang="${l}" href="${cfg.site}${p}">`).join('\n')+`\n<link rel="alternate" hreflang="x-default" href="${cfg.site}${group.en}">`;
function shell(lang,title,description,path,body,group=cfg.paths,article=false){
 const c=cfg.locales[lang],home=lang==='en'?'/':`/${lang}/`;
 const schema={'@context':'https://schema.org','@type':article?'Article':'CollectionPage',url:cfg.site+path,name:title,description,inLanguage:lang,publisher:{'@type':cfg.kind==='person'?'Person':'Organization',name:cfg.brand,url:cfg.site+'/'}};
 if(article)Object.assign(schema,{headline:title,datePublished:article,dateModified:article,author:{'@type':'Person',name:'Timothy Ivaikin',url:'https://ivaikin.com/'},mainEntityOfPage:cfg.site+path});
 return `<!doctype html>\n<html lang="${lang}"${lang==='ar'?' dir="rtl"':''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)} | ${e(cfg.brand)}</title><meta name="description" content="${e(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${cfg.site}${path}">${links(group)}<meta property="og:type" content="${article?'article':'website'}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${cfg.site}${path}"><meta property="og:site_name" content="${e(cfg.brand)}"><meta name="twitter:card" content="summary">${cfg.styles.map(p=>`<link rel="stylesheet" href="${p}">`).join('')}<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"><link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png"><link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png"><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script></head><body class="${cfg.kind}"><a class="press-skip" href="#main">${lang==='ru'?'К содержанию':lang==='ar'?'إلى المحتوى':lang==='zh'?'跳至内容':lang==='es'?'Ir al contenido':'Skip to content'}</a><div class="press-wrap"><header class="press-header"><a class="press-brand" href="${home}">${cfg.logo?`<img src="${cfg.logo}" alt="${e(cfg.brand)}" width="130" height="30">`:e(cfg.brand)}</a><nav aria-label="${e(c.title)}"><a href="${home}">${e(c.home)}</a><a href="${cfg.paths[lang]}">${e(c.title)}</a></nav><nav class="langs" aria-label="Language">${Object.entries(group).map(([l,p])=>`<a href="${p}" lang="${l}" hreflang="${l}"${l===lang?' aria-current="page"':''}>${l.toUpperCase()}</a>`).join('')}</nav></header><main id="main">${body}</main><footer class="press-footer"><span>${e(cfg.brand)} · ${e(c.updated)}</span><a href="${cfg.kind==='person'?'https://edgeivaikin.com/'+(lang==='ru'?'ru/':'')+'press/':'https://ivaikin.com/'+(lang==='ru'?'ru/':'')+'press/'}">${e(c.company)}</a></footer></div></body></html>\n`;
}
const owned=[];const sitemapGroups=[cfg.paths];
for(const [lang,c]of Object.entries(cfg.locales)){
 const ru=lang==='ru',ar=cfg.kind==='company';
 const archive=ru?cfg.archiveURLsRU:(c.archiveURLs||cfg.archiveURLs);
 if(archive.length!==c.news.length||archive.length!==c.newsDeck.length||archive.length!==c.newsDate.length)throw new Error(`Press archive length mismatch for ${lang}`);
 const brandPath=(ru?'/ru/':'/')+'partners/brand/';
 const body=`<section class="press-hero"><div><h1>${e(c.title)}</h1><p class="press-lede">${e(c.intro)}</p></div><aside class="press-contact"><h2>${e(c.contact)}</h2><p>${e(c.request)}</p><a href="mailto:hello@edgeivaikin.com?subject=${encodeURIComponent((ru?'Запрос СМИ: ':'Media request: ')+cfg.brand)}">hello@edgeivaikin.com</a></aside></section><div class="press-grid"><section aria-labelledby="releases"><h2 id="releases">${e(c.archive)}</h2><p class="press-note">${e(c.archiveNote)}</p>${archive.map((url,i)=>`<article class="press-news"><p class="press-date">${e(c.newsDate[i])}</p><h3><a href="${url}">${e(c.news[i])}</a></h3><p>${e(c.newsDeck[i])}</p><a href="${url}">${e(c.more)}</a></article>`).join('')}</section><aside class="press-about"><h2>${e(c.bio)}</h2><p>${e(c.bioText)}</p><nav class="press-downloads" aria-label="${e(c.downloads)}"><a href="/assets/press/${cfg.downloadPrefix}-en.txt" download>${e(c.bioEN)}</a><a href="/assets/press/${cfg.downloadPrefix}-ru.txt" download>${e(c.bioRU)}</a></nav><h2>${e(c.topics)}</h2><ul>${c.topicList.map(t=>`<li>${e(t)}</li>`).join('')}</ul><h2>${e(c.fact)}</h2><p>${e(c.photo)}</p>${ar?`<p><a href="${brandPath}">${e(c.brand)}</a></p><p><a href="${ru?'/ru/':'/'}#proof">${e(c.related)}</a></p>`:`<p><a href="${ru?'/ru/':'/'}#ideas">${e(c.related)}</a></p>`}</aside></div>`;
 const p=resolve(root,'.'+cfg.paths[lang]);await mkdir(p,{recursive:true});await writeFile(resolve(p,'index.html'),shell(lang,c.title,c.intro,cfg.paths[lang],body));owned.push(cfg.paths[lang]);
}
for(const [slug,article] of Object.entries(cfg.articles||{})){
 if(!article||Array.isArray(article)||typeof article!=='object')throw new Error(`articles.${slug} must be {eventDate, publishedDate, ru:[], en:[]}`);
 const langs=Object.keys(cfg.paths).filter(lang=>Array.isArray(article[lang]));
 if(!langs.length||!article.eventDate||!article.publishedDate)throw new Error(`articles.${slug} needs eventDate, publishedDate and a locale array`);
 const group={};for(const lang of langs)group[lang]=`${cfg.paths[lang].replace(/\/$/,'')}/${slug}/`;
 sitemapGroups.push(group);
 for(const lang of langs){
  const c=cfg.locales[lang],parts=article[lang],[title,deck,...rest]=parts;
  const eventLabel=article.eventLabel?.[lang],publishedLabel=article.publishedLabel?.[lang];
  if(!eventLabel||!publishedLabel)throw new Error(`articles.${slug} needs eventLabel.${lang} and publishedLabel.${lang}`);
  const body=`<article class="release"><div class="release-meta"><span>${e(c.releaseLabel)}</span><time datetime="${article.publishedDate}">${e(publishedLabel)}</time></div><h1>${e(title)}</h1><p class="press-lede">${e(deck)}</p><p class="press-note"><time datetime="${article.eventDate}">${e(eventLabel)}</time></p><div class="release-copy">${rest.map(p=>`<p>${e(p)}</p>`).join('')}</div><div class="release-bio"><a href="/assets/press/${slug}-${lang}.txt" download>${lang==='ru'?'Скачать текст релиза · TXT':'Download release · TXT'}</a><p><a href="${cfg.paths[lang]}">${e(c.back)}</a></p></div></article>`;
  const p=resolve(root,'.'+group[lang]);await mkdir(p,{recursive:true});await writeFile(resolve(p,'index.html'),shell(lang,title,deck,group[lang],body,group,article.publishedDate));await writeFile(resolve(root,`assets/press/${slug}-${lang}.txt`),parts.join('\n\n')+'\n');owned.push(group[lang]);
 }
}
const sitemapPath=resolve(root,'sitemap.xml');let xml=await readFile(sitemapPath,'utf8');if(!xml.includes('</urlset>'))throw new Error('Invalid sitemap');
for(const group of sitemapGroups)for(const path of Object.values(group)){
 const loc=cfg.site+path,alts=xml.includes('xmlns:xhtml=')?Object.entries(group).map(([l,p])=>`<xhtml:link rel="alternate" hreflang="${l}" href="${cfg.site}${p}"/>`).join(''):'';
 const block=`<url><loc>${loc}</loc>${alts}</url>`;
 let found=false;
 xml=xml.replace(/[ \t]*<url\b[^>]*>[\s\S]*?<\/url>\s*/g,m=>{
  const got=m.match(/<loc>\s*([^<]+)\s*<\/loc>/);
  if(!got||got[1]!==loc)return m;
  found=true;
  return m.trim()===block?m:block+(m.endsWith('\n')?'\n':'');
 });
 if(!found)xml=xml.replace('</urlset>',`${block}\n</urlset>`);
}
await writeFile(sitemapPath,xml);
console.log(`Built ${owned.length} public press pages for ${cfg.brand}.`);
