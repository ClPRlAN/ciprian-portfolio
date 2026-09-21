import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './site.config.mjs';
import { languages, ui, skills, projects, presentations, research, certifications } from './content/data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
copyDir(path.join(__dirname, 'public'), out);
fs.copyFileSync(path.join(__dirname, 'src/styles.css'), path.join(out, 'styles.css'));
fs.copyFileSync(path.join(__dirname, 'src/site.js'), path.join(out, 'site.js'));

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dst, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const langPath = (lang, route='') => `${languages[lang].prefix}${route || '/'} `.trim().replace(/\/$/, '') || '/';
const routeFor = (lang, route='') => {
  const p = languages[lang].prefix;
  if (!route || route === '/') return p || '/';
  return `${p}${route}`;
};
const currentForLanguage = (targetLang, route) => routeFor(targetLang, route);

function writePage(lang, route, html) {
  const rel = routeFor(lang, route).replace(/^\//,'');
  const dir = rel ? path.join(out, rel) : out;
  fs.mkdirSync(dir, { recursive:true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

function layout({ lang, route, title, description, content, pageType='website' }) {
  const t = ui[lang];
  const canonical = site.domain + routeFor(lang, route);
  const isHome = route === '/';
  const navRoute = (key, routePath) => isHome ? `#${key}` : routeFor(lang, routePath);
  const languageLinks = Object.keys(languages).map(l => `<a href="${currentForLanguage(l, route)}" hreflang="${l}">${languages[l].label}</a>`).join('');
  const mobileLanguageLinks = Object.keys(languages).map(l => `<a href="${currentForLanguage(l, route)}">${languages[l].label}</a>`).join('');
  const fullTitle = title ? `${title} — ${site.name}` : `${site.name} — Business & Financial Analyst`;
  const ogImage = `${site.domain}/assets/og-card.svg`;
  const nav = [
    ['home','/',t.nav.home], ['about','/about',t.nav.about], ['projects','/projects',t.nav.projects], ['presentations','/presentations',t.nav.presentations], ['research','/research',t.nav.research], ['certifications','/certifications',t.nav.certifications], ['contact','/contact',t.nav.contact]
  ];
  const navHtml = nav.map(([key,p,label]) => {
    const href = key==='home' ? routeFor(lang,'/') : navRoute(key,p);
    const current = route===p ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${esc(label)}</a>`;
  }).join('');
  const mobileNav = nav.map(([key,p,label]) => `<a href="${key==='home'?routeFor(lang,'/'):navRoute(key,p)}">${esc(label)}</a>`).join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${pageType}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">
${Object.keys(languages).map(l=>`<link rel="alternate" hreflang="${l}" href="${site.domain}${currentForLanguage(l,route)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${site.domain}${currentForLanguage('en',route)}">
<link rel="icon" href="/assets/logo-placeholder.svg">
<link rel="stylesheet" href="/styles.css">
<script>try{const t=localStorage.getItem('theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="nav-wrap">
  <nav class="nav" aria-label="Primary">
    <a class="brand" href="${routeFor(lang,'/')}" aria-label="${site.name} Home"><img src="${site.logoImage}" alt=""><span>${site.name}</span></a>
    <div class="nav-links">${navHtml}</div>
    <div class="nav-actions">
      <a class="cv-btn" href="${site.cvPath}" target="_blank" rel="noopener">${esc(t.nav.cv)}</a>
      <div class="lang"><button class="lang-btn" aria-expanded="false" aria-label="Language">${languages[lang].label}⌄</button><div class="lang-menu">${languageLinks}</div></div>
      <button class="icon-btn" data-theme-toggle aria-label="Toggle theme">☾</button>
      <button class="icon-btn menu-btn" aria-expanded="false" aria-label="Open menu">☰</button>
    </div>
  </nav>
</header>
<div class="mobile-menu" aria-label="Mobile navigation">${mobileNav}<div class="mobile-sub"><a href="${site.cvPath}" target="_blank">${esc(t.nav.cv)}</a>${mobileLanguageLinks}<button data-theme-toggle aria-label="Toggle theme">☾</button></div></div>
<main id="main">${content}</main>
<footer class="footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} ${site.name}</span><div class="footer-links"><a href="${site.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${site.github}" target="_blank" rel="noopener">GitHub</a><a href="mailto:${site.email}">${site.email}</a></div></div></footer>
<script src="/site.js" defer></script>
</body></html>`;
}

function card({ kicker, title, description, href, tags=[], inverse=false }) {
  return `<a class="card reveal${inverse?' card-inverse':''}" href="${href}"><div class="card-kicker">${esc(kicker)}</div><h3>${esc(title)}</h3>${description?`<p>${esc(description)}</p>`:''}<div class="card-bottom"><div class="tags">${tags.slice(0,3).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><span class="arrow">↗</span></div></a>`;
}
function sectionCards(lang, id, title, items, hrefAll, kind) {
  const t=ui[lang];
  const cards = items.slice(0,3).map(item => {
    const titleText = typeof item.title==='string' ? item.title : item.title[lang];
    const desc = item.description ? (typeof item.description==='string'?item.description:item.description[lang]) : item.issuer || '';
    let href = hrefAll;
    if (kind==='project') href=routeFor(lang,`/projects/${item.slug}`);
    if (kind==='presentation') href=routeFor(lang,`/presentations/${item.slug}`);
    return card({kicker:kind==='cert'?item.year:(item.year||item.date||kind),title:titleText,description:desc,href,tags:item.tools||[]});
  }).join('');
  const view = card({kicker:'',title:t.home.viewAll,description:'',href:routeFor(lang,hrefAll),inverse:true});
  return `<section class="section" id="${id}"><div class="container"><div class="section-head reveal"><div><p class="eyebrow">${esc(title)}</p><h2>${esc(title)}</h2></div></div><div class="card-grid">${cards}${view}</div></div></section>`;
}

function home(lang) {
  const t=ui[lang];
  return layout({lang,route:'/',description:'Business & Financial Analyst portfolio of Ciprian Loghin, MSc Data Science & Finance at the University of Zurich.',content:`
<section class="hero"><div class="hero-grid"><div class="reveal"><div class="hero-name">Ciprian Loghin</div><div class="hero-meta"><span>${esc(t.hero.degree)}</span><span>${esc(t.hero.role)}</span></div><h1 class="hero-title">${esc(t.hero.slogan)}</h1><p class="hero-bio">${esc(t.hero.bio)}</p><a class="text-link" href="#projects">${esc(t.hero.cta)} ↓</a></div><div class="hero-photo-shell reveal"><img class="hero-photo" src="${site.heroImage}" alt="Ciprian Loghin working at a desk — placeholder image"></div></div></section>
<section class="section" id="about"><div class="container intro-grid"><div><p class="eyebrow reveal">${esc(t.home.aboutEyebrow)}</p></div><div class="intro-copy reveal"><h2>${esc(t.home.aboutTitle)}</h2><p>${esc(t.home.aboutText)}</p><a class="text-link" href="${routeFor(lang,'/about')}">${esc(t.home.moreAbout)} ↗</a></div></div></section>
${sectionCards(lang,'projects',t.home.selectedProjects,projects, '/projects','project')}
${sectionCards(lang,'presentations',t.home.presentations,presentations, '/presentations','presentation')}
${sectionCards(lang,'research',t.home.research,research, '/research','research')}
${sectionCards(lang,'certifications',t.home.certifications,certifications, '/certifications','cert')}
<section class="contact-cta" id="contact"><div class="container contact-cta-inner reveal"><div><p class="eyebrow">${esc(t.nav.contact)}</p><h2>${esc(t.home.contactTitle)}</h2><p class="lede">${esc(t.home.contactText)}</p></div><a class="button primary" href="${routeFor(lang,'/contact')}">${esc(t.home.contactCta)} ↗</a></div></section>`});
}

function pageHero(title, intro, eyebrow='') { return `<section class="page-hero"><div class="container reveal">${eyebrow?`<p class="eyebrow">${esc(eyebrow)}</p>`:''}<h1>${esc(title)}</h1><p class="lede">${esc(intro)}</p></div></section>`; }

function aboutPage(lang) {
  const t=ui[lang];
  const skillGroup=(title,items)=>`<div class="skill-group reveal"><h3>${esc(title)}</h3><div class="skill-list">${items.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div></div>`;
  const content=`${pageHero(t.about.title,t.about.p1,t.about.eyebrow)}<section class="section-sm"><div class="container about-layout"><div class="about-portrait reveal">Professional portrait placeholder</div><div class="about-copy reveal"><p>${esc(t.about.p1)}</p><p>${esc(t.about.p2)}</p><p>${esc(t.about.p3)}</p></div></div><div class="container"><div class="skills">${skillGroup(t.about.businessFinance,skills.business)}${skillGroup(t.about.dataAnalytics,skills.data)}${skillGroup(t.about.toolsCollaboration,skills.tools)}</div></div></section>`;
  return layout({lang,route:'/about',title:t.nav.about,description:t.about.p1,content});
}

function projectsPage(lang) {
  const t=ui[lang];
  const items=projects.map(p=>card({kicker:p.year,title:p.title[lang],description:p.description[lang],href:routeFor(lang,`/projects/${p.slug}`),tags:p.tools})).join('');
  return layout({lang,route:'/projects',title:t.pages.projectsTitle,description:t.pages.projectsIntro,content:`${pageHero(t.pages.projectsTitle,t.pages.projectsIntro)}<section class="section-sm"><div class="container list-grid">${items}</div></section>`});
}
function projectPage(lang,p) {
  const t=ui[lang];
  const s=p.sections?.[lang];
  if (p.placeholder || !s) {
    return layout({lang,route:`/projects/${p.slug}`,title:p.title[lang],description:p.description[lang],content:`${pageHero(p.title[lang],p.description[lang],'Project')}<section class="section-sm"><div class="container"><div class="card card-inverse"><h3>${esc(t.common.comingSoon)}</h3><p>${esc(p.description[lang])}</p></div></div></section>`});
  }
  const sections=[['overview',t.project.overview],['problem',t.project.problem],['objective',t.project.objective],['approach',t.project.approach],['methodology',t.project.methodology],['insights',t.project.insights],['results',t.project.results],['technical',t.project.technical]];
  const nav=sections.map(([id,label])=>`<a href="#${id}">${esc(label)}</a>`).join('');
  const body=sections.map(([id,label])=>`<section class="case-section" id="${id}"><h2>${esc(label)}</h2><p>${esc(s[id])}</p></section>`).join('');
  const actions=`<div class="action-row">${p.github?`<a class="button primary" href="${p.github}" target="_blank" rel="noopener">${esc(t.common.github)} ↗</a>`:''}${p.colab?`<a class="button" href="${p.colab}" target="_blank" rel="noopener">${esc(t.common.colab)} ↗</a>`:''}</div>`;
  const content=`<section class="case-hero"><div class="container reveal"><div class="case-meta"><span>${esc(p.year)}</span>${p.tools.map(x=>`<span>${esc(x)}</span>`).join('')}</div><h1>${esc(p.title[lang])}</h1><p class="case-summary">${esc(p.description[lang])}</p>${actions}</div></section><section class="section-sm"><div class="container case-layout"><aside class="case-nav">${nav}</aside><div class="reveal">${body}</div></div></section>`;
  return layout({lang,route:`/projects/${p.slug}`,title:p.title[lang],description:p.description[lang],content,pageType:'article'});
}

function presentationsPage(lang) {
  const t=ui[lang];
  const items=presentations.map(p=>card({kicker:p.date,title:p.title,description:p.description[lang],href:routeFor(lang,`/presentations/${p.slug}`)})).join('');
  return layout({lang,route:'/presentations',title:t.pages.presentationsTitle,description:t.pages.presentationsIntro,content:`${pageHero(t.pages.presentationsTitle,t.pages.presentationsIntro)}<section class="section-sm"><div class="container list-grid">${items}</div></section>`});
}
function presentationPage(lang,p) {
  const t=ui[lang];
  const viewer=p.pdf?`<iframe src="${p.pdf}" title="${esc(p.title)} PDF"></iframe>`:`<div class="empty-pdf"><div><p class="eyebrow">PDF</p><h2>${esc(t.common.comingSoon)}</h2><p>${esc(p.description[lang])}</p></div></div>`;
  const content=`${pageHero(p.title,p.description[lang],t.nav.presentations)}<section class="section-sm"><div class="container"><div class="pdf-frame reveal">${viewer}</div>${p.pdf?`<div class="action-row"><a class="button" href="${p.pdf}" target="_blank">${esc(t.common.openPresentation)} ↗</a></div>`:''}</div></section>`;
  return layout({lang,route:`/presentations/${p.slug}`,title:p.title,description:p.description[lang],content,pageType:'article'});
}

function researchPage(lang) {
  const t=ui[lang];
  const items=research.map(r=>`<article class="research-item reveal"><div>${esc(r.year)}</div><div><h3>${esc(r.title)}</h3><p>${esc(r.abstract[lang])}</p><div class="tags" style="margin-top:14px"><span class="tag">${esc(r.authors)}</span>${r.topic!=='—'?`<span class="tag">${esc(r.topic)}</span>`:''}</div></div><div>${r.pdf?`<a class="button" href="${r.pdf}" target="_blank">${esc(t.common.openPdf)} ↗</a>`:`<span class="tag">PDF soon</span>`}</div></article>`).join('');
  return layout({lang,route:'/research',title:t.pages.researchTitle,description:t.pages.researchIntro,content:`${pageHero(t.pages.researchTitle,t.pages.researchIntro)}<section class="section-sm"><div class="container research-list">${items}</div></section>`});
}

function certificationsPage(lang) {
  const t=ui[lang];
  const items=certifications.map(c=>`<article class="cert reveal"><span class="cert-year">${esc(c.year)}</span><h3>${esc(c.title)}</h3><p>${esc(c.issuer)}</p></article>`).join('');
  return layout({lang,route:'/certifications',title:t.pages.certificationsTitle,description:t.pages.certificationsIntro,content:`${pageHero(t.pages.certificationsTitle,t.pages.certificationsIntro)}<section class="section-sm"><div class="container cert-grid">${items}</div></section>`});
}

function contactPage(lang) {
  const t=ui[lang];
  const endpoint=`https://formspree.io/f/${site.formspreeId}`;
  const content=`${pageHero(t.pages.contactTitle,t.pages.contactIntro)}<section class="section-sm"><div class="container contact-grid"><form class="contact-form reveal" data-contact-form data-not-ready="${esc(t.contact.formNotReady)}" data-success="${esc(t.contact.success)}" action="${endpoint}" method="POST"><div class="field"><label for="name">${esc(t.contact.name)}</label><input id="name" name="name" required autocomplete="name"></div><div class="field"><label for="email">${esc(t.contact.email)}</label><input id="email" type="email" name="email" required autocomplete="email"></div><div class="field"><label for="subject">${esc(t.contact.subject)}</label><input id="subject" name="subject" required></div><div class="field"><label for="message">${esc(t.contact.message)}</label><textarea id="message" name="message" required></textarea></div><button class="button primary" type="submit">${esc(t.contact.send)} ↗</button><div class="status" role="status" aria-live="polite"></div></form><div class="contact-details reveal"><div class="contact-row"><span>Email</span><a href="mailto:${site.email}">${site.email}</a></div><div class="contact-row"><span>LinkedIn</span><a href="${site.linkedin}" target="_blank">ciprianloghin97 ↗</a></div><div class="contact-row"><span>GitHub</span><a href="${site.github}" target="_blank">ClPRlAN ↗</a></div><div class="contact-row"><span>${esc(t.contact.phone)}</span><span><span data-phone-value>+41 •• ••• •• ••</span> <button class="text-link" style="background:none;border:0;cursor:pointer" data-reveal-phone data-phone="${site.phone}">${esc(t.contact.reveal)}</button></span></div><div class="contact-row"><span>${esc(t.contact.location)}</span><span>${site.location}</span></div></div></div></section>`;
  return layout({lang,route:'/contact',title:t.nav.contact,description:t.pages.contactIntro,content});
}

for (const lang of Object.keys(languages)) {
  writePage(lang,'/',home(lang));
  writePage(lang,'/about',aboutPage(lang));
  writePage(lang,'/projects',projectsPage(lang));
  for (const p of projects) writePage(lang,`/projects/${p.slug}`,projectPage(lang,p));
  writePage(lang,'/presentations',presentationsPage(lang));
  for (const p of presentations) writePage(lang,`/presentations/${p.slug}`,presentationPage(lang,p));
  writePage(lang,'/research',researchPage(lang));
  writePage(lang,'/certifications',certificationsPage(lang));
  writePage(lang,'/contact',contactPage(lang));
}

const routes=[];
for (const lang of Object.keys(languages)) {
  routes.push('/', '/about','/projects',...projects.map(p=>`/projects/${p.slug}`),'/presentations',...presentations.map(p=>`/presentations/${p.slug}`),'/research','/certifications','/contact');
}
const locs=[];
for (const lang of Object.keys(languages)) {
  const base=languages[lang].prefix;
  const local=['/', '/about','/projects',...projects.map(p=>`/projects/${p.slug}`),'/presentations',...presentations.map(p=>`/presentations/${p.slug}`),'/research','/certifications','/contact'];
  for (const r of local) locs.push(`${site.domain}${routeFor(lang,r)}`);
}
fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs.map(l=>`<url><loc>${l}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
fs.writeFileSync(path.join(out,'_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`);

console.log(`Built ${locs.length} localized pages into dist/`);
