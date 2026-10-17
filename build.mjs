import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { renderNotebook } from './lib/notebook.mjs';
import { pageSeo, sitemapXml } from './lib/seo.mjs';
import { site } from './site.config.mjs';
import { languages, ui, skills, projects, certifications } from './content/data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
copyDir(path.join(__dirname, 'public'), out);
fs.copyFileSync(path.join(__dirname, 'src/styles.css'), path.join(out, 'styles.css'));
fs.copyFileSync(path.join(__dirname, 'src/site.js'), path.join(out, 'site.js'));
const fontsOut = path.join(out, 'fonts');
fs.mkdirSync(fontsOut, { recursive: true });
for (const [packageName, filenames] of [
  ['@fontsource-variable/inter', ['inter-latin-wght-normal.woff2', 'inter-latin-ext-wght-normal.woff2']],
  ['@fontsource-variable/space-grotesk', ['space-grotesk-latin-wght-normal.woff2', 'space-grotesk-latin-ext-wght-normal.woff2']]
]) {
  const packageRoot = path.join(__dirname, 'node_modules', packageName);
  for (const filename of filenames) fs.copyFileSync(path.join(packageRoot, 'files', filename), path.join(fontsOut, filename));
  fs.copyFileSync(path.join(packageRoot, 'LICENSE'), path.join(fontsOut, `${packageName.split('/').pop()}-LICENSE.txt`));
}
const notebookSources = JSON.parse(fs.readFileSync(path.join(__dirname, 'content/notebooks/sources.json'), 'utf8'));
const notebookViews = new Map();
for (const project of projects) {
  const filename = path.join(__dirname, 'content/notebooks', project.notebookFile);
  const source = fs.readFileSync(filename);
  const provenance = notebookSources[project.slug];
  if (createHash('sha256').update(source).digest('hex') !== provenance.sha256) {
    throw new Error(`Notebook snapshot does not match its source: ${project.slug}`);
  }
  for (const lang of Object.keys(languages)) {
    const labels = { en: ['Code','Output','Raw cell','Saved notebook chart'], it: ['Codice','Risultato','Cella di testo','Grafico salvato nel notebook'], de: ['Code','Ausgabe','Textzelle','Gespeichertes Notebook-Diagramm'] }[lang];
    notebookViews.set(`${project.slug}/${lang}`, renderNotebook(JSON.parse(source.toString('utf8')), {
      codeLabel: labels[0], outputLabel: labels[1], rawLabel: labels[2], imageAlt: labels[3]
    }));
  }
  fs.mkdirSync(path.join(out, 'notebooks'), { recursive: true });
  fs.copyFileSync(filename, path.join(out, 'notebooks', project.notebookFile));
  if (!fs.existsSync(path.join(out, project.reportPdf))) throw new Error(`Missing project report: ${project.slug}`);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dst, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const routeFor = (lang, route='') => {
  const p = languages[lang].prefix;
  if (!route || route === '/') return p || '/';
  return `${p}${route}`;
};
const currentForLanguage = (targetLang, route) => routeFor(targetLang, route);
const linkArrow = '<svg class="link-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function writePage(lang, route, html) {
  const rel = routeFor(lang, route).replace(/^\//,'');
  const dir = rel ? path.join(out, rel) : out;
  fs.mkdirSync(dir, { recursive:true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

function layout({ lang, route, title, description, content, pageType='website' }) {
  const t = ui[lang];
  const seo = pageSeo({ lang, route, title, description });
  const canonical = seo.canonical;
  description = seo.description;
  const navRoute = (_key, routePath) => routeFor(lang, routePath);
  const languageLinks = Object.keys(languages).map(l => `<a href="${currentForLanguage(l, route)}" hreflang="${l}">${languages[l].label}</a>`).join('');
  const mobileLanguageLinks = Object.keys(languages).map(l => `<a href="${currentForLanguage(l, route)}">${languages[l].label}</a>`).join('');
  const fullTitle = seo.title;
  const ogImage = seo.image.url;
  const nav = [
    ['home','/',t.nav.home], ['about','/about',t.nav.about], ['projects','/projects',t.nav.projects], ['certifications','/certifications',t.nav.certifications], ['contact','/contact',t.nav.contact]
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
<meta name="author" content="${esc(site.name)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${pageType}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:type" content="${seo.image.type}">
<meta property="og:image:width" content="${seo.image.width}">
<meta property="og:image:height" content="${seo.image.height}">
<meta property="og:image:alt" content="${esc(seo.image.alt)}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${seo.ogLocale}">
${seo.alternateOgLocales.map(locale=>`<meta property="og:locale:alternate" content="${locale}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">
<meta name="twitter:image:alt" content="${esc(seo.image.alt)}">
${seo.alternates.map(({hreflang,href})=>`<link rel="alternate" hreflang="${hreflang}" href="${href}">`).join('\n')}
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon-48.png" sizes="48x48" type="image/png">
<link rel="icon" href="/favicon-96.png" sizes="96x96" type="image/png">
<link rel="icon" media="(prefers-color-scheme: light)" href="/favicon-light.png" type="image/png">
<link rel="icon" media="(prefers-color-scheme: dark)" href="/favicon-dark.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script type="application/ld+json">${JSON.stringify(seo.structuredData).replace(/</g,'\\u003c')}</script>
<link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/space-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
<script>try{const t=localStorage.getItem('theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}</script>
</head>
<body>
<div class="reading-progress" aria-hidden="true"></div>
<a class="skip-link" href="#main">${esc(t.common.skip)}</a>
<header class="nav-wrap">
  <nav class="nav" aria-label="${esc(t.common.primaryNav)}">
    <a class="brand" href="${routeFor(lang,'/')}" aria-label="${site.name} Home"><img src="${site.logoImage}" alt="" width="34" height="34"><span>${site.name}</span></a>
    <div class="nav-links">${navHtml}</div>
    <div class="nav-actions">
      <a class="cv-btn" href="${site.cvPath}" target="_blank" rel="noopener">${esc(t.nav.cv)}</a>
      <div class="lang"><button class="lang-btn" aria-expanded="false" aria-label="${esc(t.common.language)}">${languages[lang].label}</button><div class="lang-menu">${languageLinks}</div></div>
      <button class="icon-btn" data-theme-toggle data-light-label="${esc(t.common.switchLight)}" data-dark-label="${esc(t.common.switchDark)}" aria-label="${esc(t.common.toggleTheme)}">☾</button>
      <button class="icon-btn menu-btn" aria-expanded="false" aria-controls="mobile-menu" data-open-label="${esc(t.common.openMenu)}" data-close-label="${esc(t.common.closeMenu)}" aria-label="${esc(t.common.openMenu)}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
    </div>
  </nav>
</header>
<div class="mobile-menu" id="mobile-menu" aria-label="${esc(t.common.mobileNav)}">${mobileNav}<div class="mobile-sub"><a href="${site.cvPath}" target="_blank" rel="noopener">${esc(t.nav.cv)}</a>${mobileLanguageLinks}<button data-theme-toggle data-light-label="${esc(t.common.switchLight)}" data-dark-label="${esc(t.common.switchDark)}" aria-label="${esc(t.common.toggleTheme)}">☾</button></div></div>
<noscript><nav class="nojs-nav" aria-label="${esc(t.common.primaryNav)}">${navHtml}<a href="${site.cvPath}">${esc(t.nav.cv)}</a>${languageLinks}</nav></noscript>
<main id="main">${content}</main>
<footer class="footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} ${site.name}</span><div class="footer-links"><a href="${site.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${site.github}" target="_blank" rel="noopener">GitHub</a><a href="mailto:${site.email}">${site.email}</a></div></div></footer>
<button class="back-to-top" data-back-to-top aria-label="${esc(t.common.backToTop)}" title="${esc(t.common.backToTop)}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
<script src="/site.js" defer></script>
</body></html>`;
}

function card({ kicker, title, description, href, tags=[], inverse=false, cover='' }) {
  const media = cover ? `<div class="card-media"><img src="${cover}" alt="" loading="lazy"></div>` : '';
  return `<a class="card reveal${inverse?' card-inverse':''}${cover?' card-with-media':''}" href="${href}">${media}<div class="card-content"><div class="card-kicker">${esc(kicker)}</div><h3>${esc(title)}</h3>${description?`<p>${esc(description)}</p>`:''}<div class="card-bottom"><div class="tags">${tags.slice(0,3).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><span class="arrow">${linkArrow}</span></div></div></a>`;
}
function sectionCards(lang, id, title, items, hrefAll, kind) {
  const t=ui[lang];
  const cards = items.slice(0,3).map(item => {
    const titleText = typeof item.title==='string' ? item.title : item.title[lang];
    const desc = item.description ? (typeof item.description==='string'?item.description:item.description[lang]) : (item.abstract ? item.abstract[lang] : (item.issuer || ''));
    let href = hrefAll;
    if (kind==='project') href=routeFor(lang,`/projects/${item.slug}`);
    if (kind==='cert') href=item.pdf;
    return card({kicker:kind==='cert'?item.year:(item.year||item.date||kind),title:titleText,description:desc,href,tags:item.tools||[],cover:item.cover||''});
  }).join('');
  const view = card({kicker:'',title:t.home.viewAll,description:'',href:routeFor(lang,hrefAll),inverse:true});
  const cardCount = Math.min(items.length, 3) + 1;
  return `<section class="section" id="${id}"><div class="container"><div class="section-head reveal"><div><h2>${esc(title)}</h2></div></div><div class="card-grid card-grid-${cardCount}">${cards}${view}</div></div></section>`;
}

function home(lang) {
  const t=ui[lang];
  return layout({lang,route:'/',description:'Business & Financial Analyst portfolio of Ciprian Loghin, MSc Data Science & Finance at the University of Zurich.',content:`
<section class="hero"><div class="hero-grid"><div class="hero-copy reveal"><div class="hero-location"><span class="status-dot" aria-hidden="true"></span>${esc(t.hero.location)}</div><div class="hero-identity"><h1 class="hero-name">Ciprian Loghin</h1><p class="hero-role">${esc(t.hero.role)}</p></div><div class="hero-meta"><span>${esc(t.hero.degree)}</span></div><h2 class="hero-title">${esc(t.hero.slogan)}</h2><p class="hero-bio">${esc(t.hero.bio)}</p><div class="hero-links"><a class="text-link primary" href="${routeFor(lang,'/projects')}">${esc(t.hero.cta)} ${linkArrow}</a><a class="text-link secondary" href="${routeFor(lang,'/about')}">${esc(t.home.moreAbout)} ${linkArrow}</a></div><div class="hero-expertise" aria-label="${esc(t.common.tools)}">${['Python','SQL','Power BI'].map(tool=>`<span class="tag">${tool}</span>`).join('')}</div></div><div class="hero-photo-shell reveal"><img class="hero-photo" src="${site.heroImage}" alt="${esc(t.hero.photoAlt)}" width="1448" height="1086" fetchpriority="high" decoding="async"><div class="hero-visual-topline" aria-hidden="true"><span class="frame-label">${esc(t.hero.frameTitle)}</span><span class="frame-signal"><i></i><i></i><i></i></span></div><div class="hero-visual-bottomline" aria-hidden="true"><span class="frame-monogram">CL</span><span>${esc(t.hero.location)}</span></div></div></div></section>
${sectionCards(lang,'projects',t.home.selectedProjects,projects, '/projects','project')}
${sectionCards(lang,'certifications',t.home.certifications,certifications.filter(c=>c.featured), '/certifications','cert')}
<section class="contact-cta" id="contact"><div class="container contact-cta-inner reveal"><div><h2>${esc(t.home.contactTitle)}</h2><p class="lede">${esc(t.home.contactText)}</p></div><a class="button primary" href="${routeFor(lang,'/contact')}">${esc(t.home.contactCta)} ${linkArrow}</a></div></section>`});
}

function pageHero(title, intro) { return `<section class="page-hero"><div class="container reveal"><h1>${esc(title)}</h1>${intro?`<p class="lede">${esc(intro)}</p>`:''}</div></section>`; }

function aboutPage(lang) {
  const t=ui[lang];
  const skillGroup=(title,items)=>`<div class="skill-group reveal"><h3>${esc(title)}</h3><div class="skill-list">${items.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div></div>`;
  const content=`${pageHero(t.about.title,t.hero.location)}<section class="section-sm"><div class="container about-layout"><figure class="about-portrait reveal"><img src="${site.aboutImage}" alt="${esc(t.about.photoAlt)}" width="1448" height="1086" loading="eager" fetchpriority="high" decoding="async"></figure><div class="about-copy reveal"><p>${esc(t.about.p1)}</p><p>${esc(t.about.p2)}</p><p>${esc(t.about.p3)}</p></div></div><div class="container"><div class="skills">${skillGroup(t.about.businessFinance,skills.business)}${skillGroup(t.about.dataAnalytics,skills.data)}${skillGroup(t.about.toolsCollaboration,skills.tools)}</div></div></section>`;
  return layout({lang,route:'/about',title:t.nav.about,description:t.about.p1,content});
}

function projectsPage(lang) {
  const t=ui[lang];
  const items=projects.map(p=>card({kicker:p.year,title:p.title[lang],description:p.description[lang],href:routeFor(lang,`/projects/${p.slug}`),tags:p.tools,cover:p.cover||''})).join('');
  return layout({lang,route:'/projects',title:t.pages.projectsTitle,description:t.pages.projectsIntro,content:`${pageHero(t.pages.projectsTitle,t.pages.projectsIntro)}<section class="section-sm"><div class="container list-grid list-grid-projects">${items}</div></section>`});
}
function projectPage(lang,p) {
  const t=ui[lang];
  const provenance=notebookSources[p.slug];
  const actions=`<div class="action-row"><a class="button primary" href="#library">${esc(t.common.projectLibrary)}</a><a class="button" href="#report">${esc(t.common.projectReport)}</a></div><div class="project-source-links">${p.github?`<a href="${p.github}" target="_blank" rel="noopener">${esc(t.common.github)} ${linkArrow}</a>`:''}${p.colab?`<a href="${p.colab}" target="_blank" rel="noopener">${esc(t.common.colab)} ${linkArrow}</a>`:''}</div>`;
  const cover=p.cover?`<figure class="container case-cover reveal"><img src="${p.cover}" alt="${esc(p.title[lang])}" loading="lazy"></figure>`:'';
  const notebook=`<section class="project-artifact-section" id="library" data-artifact-panel><div class="container"><div class="artifact-head"><div><h2>${esc(t.common.projectLibrary)}</h2><p>${esc(t.common.libraryIntro)}</p></div><a class="text-link" href="/notebooks/${p.notebookFile}" download>${esc(t.common.downloadNotebook)} ↓</a></div><div class="notebook-toolbar"><span>${esc(t.common.libraryNote)}</span><a href="${provenance.sourceUrl}" target="_blank" rel="noopener">${esc(t.common.snapshot)} ${provenance.commit.slice(0,7)} ${linkArrow}</a></div><div class="notebook-shell" role="region" aria-label="${esc(t.common.projectLibrary)} — ${esc(p.title[lang])}" tabindex="0"><div class="notebook-content" lang="en">${notebookViews.get(`${p.slug}/${lang}`)}</div></div></div></section>`;
  const report=`<section class="project-artifact-section" id="report" data-artifact-panel><div class="container"><div class="artifact-head"><div><h2>${esc(t.common.projectReport)}</h2><p>${esc(t.common.reportIntro)}</p></div><a class="text-link" href="${p.reportPdf}" target="_blank" rel="noopener">${esc(t.common.openPdf)} ${linkArrow}</a></div><div class="pdf-frame project-report-frame"><iframe src="${p.reportPdf}#view=FitH" title="${esc(t.common.projectReport)} — ${esc(p.title[lang])}" loading="lazy"></iframe></div></div></section>`;
  const content=`<section class="case-hero"><div class="container reveal"><div class="case-meta"><span>${esc(p.year)}</span>${p.tools.map(x=>`<span>${esc(x)}</span>`).join('')}</div><h1>${esc(p.title[lang])}</h1><p class="case-summary">${esc(p.description[lang])}</p>${actions}</div></section>${cover}<div class="project-workspace" data-artifact-tabs><nav class="artifact-tabs" aria-label="${esc(t.common.projectContents)}"><a href="#library" data-artifact-tab="library">${esc(t.common.projectLibrary)}</a><a href="#report" data-artifact-tab="report">${esc(t.common.projectReport)}</a></nav>${notebook}${report}</div>`;
  return layout({lang,route:`/projects/${p.slug}`,title:p.title[lang],description:p.description[lang],content,pageType:'article'});
}

function certificationsPage(lang) {
  const t=ui[lang];
  const cards=items=>items.map(c=>`<a class="cert reveal" href="${c.pdf}" target="_blank" rel="noopener"><div class="cert-media"><img src="${c.cover}" alt="${esc(c.title)}" loading="lazy"></div><div class="cert-body"><span class="cert-year">${esc(c.year)}${c.validUntil?` · ${esc(t.common.validUntil)} ${esc(c.validUntil)}`:''}</span><h3>${esc(c.title)}</h3><p>${esc(c.issuer)}</p><span class="cert-link">${esc(t.common.viewCertificate)} ${linkArrow}</span></div></a>`).join('');
  const professional=certifications.filter(c=>c.category!=='education');
  const academic=certifications.filter(c=>c.category==='education');
  const content=`${pageHero(t.pages.certificationsTitle,t.pages.certificationsIntro)}<section class="section-sm"><div class="container cert-grid">${cards(professional)}</div></section><section class="section-sm"><div class="container"><div class="section-head"><div><h2>${esc(t.common.education)}</h2><p class="lede">${esc(t.common.educationIntro)}</p></div></div><div class="cert-grid">${cards(academic)}</div></div></section>`;
  return layout({lang,route:'/certifications',title:t.pages.certificationsTitle,description:t.pages.certificationsIntro,content});
}

function contactPage(lang) {
  const t=ui[lang];
  const endpoint=`https://formspree.io/f/${site.formspreeId}`;
  const content=`${pageHero(t.pages.contactTitle,t.pages.contactIntro)}<section class="section-sm"><div class="container contact-grid"><div class="contact-form-shell reveal"><form class="contact-form" data-contact-form data-not-ready="${esc(t.contact.formNotReady)}" data-success="${esc(t.contact.success)}" data-error="${esc(t.contact.error)}" data-sending="${esc(t.contact.sending)}" action="${endpoint}" method="POST"><div class="field"><label for="name">${esc(t.contact.name)}</label><input id="name" name="name" required autocomplete="name"></div><div class="field"><label for="email">${esc(t.contact.email)}</label><input id="email" type="email" name="email" required autocomplete="email"></div><div class="field"><label for="subject">${esc(t.contact.subject)}</label><input id="subject" name="subject" required></div><div class="field"><label for="message">${esc(t.contact.message)}</label><textarea id="message" name="message" required></textarea></div><button class="button primary" type="submit">${esc(t.contact.send)} ${linkArrow}</button><div class="status" role="status" aria-live="polite"></div></form><div class="contact-success" data-contact-success tabindex="-1" hidden><h2>${esc(t.contact.successTitle)}</h2><p>${esc(t.contact.successBody)}</p></div></div><div class="contact-details reveal"><div class="contact-row"><span>Email</span><a href="mailto:${site.email}">${site.email}</a></div><div class="contact-row"><span>LinkedIn</span><a href="${site.linkedin}" target="_blank">ciprianloghin97 ${linkArrow}</a></div><div class="contact-row"><span>GitHub</span><a href="${site.github}" target="_blank">ClPRlAN ${linkArrow}</a></div><div class="contact-row"><span>${esc(t.contact.phone)}</span><span><span data-phone-value>+41 •• ••• •• ••</span> <button class="text-link" data-reveal-phone data-phone="${site.phone}">${esc(t.contact.reveal)}</button></span></div><div class="contact-row"><span>${esc(t.contact.location)}</span><span>${site.location}</span></div></div></div></section>`;
  return layout({lang,route:'/contact',title:t.nav.contact,description:t.pages.contactIntro,content});
}

for (const lang of Object.keys(languages)) {
  writePage(lang,'/',home(lang));
  writePage(lang,'/about',aboutPage(lang));
  writePage(lang,'/projects',projectsPage(lang));
  for (const p of projects) writePage(lang,`/projects/${p.slug}`,projectPage(lang,p));
  writePage(lang,'/certifications',certificationsPage(lang));
  writePage(lang,'/contact',contactPage(lang));
}

const sitemapRoutes=['/', '/about', '/projects', ...projects.map(p=>`/projects/${p.slug}`), '/certifications', '/contact'];
fs.writeFileSync(path.join(out,'sitemap.xml'), sitemapXml(sitemapRoutes));
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
fs.writeFileSync(path.join(out,'_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`);

console.log(`Built ${sitemapRoutes.length * Object.keys(languages).length} localized pages into dist/`);
