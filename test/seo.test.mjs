import test from 'node:test';
import assert from 'node:assert/strict';
import { pageSeo, sitemapXml } from '../lib/seo.mjs';
import { site } from '../site.config.mjs';
import { projects } from '../content/data.mjs';

const langs = ['en', 'it', 'de'];
const routes = ['/', '/about', '/projects', '/certifications', '/contact', ...projects.map(project => `/projects/${project.slug}`)];
const graphType = (seo, type) => seo.structuredData['@graph'].find(item => item['@type'] === type);

test('every language and route has a distinct name-first title and reciprocal global and Swiss alternates', () => {
  const titles = new Set();
  for (const lang of langs) {
    for (const route of routes) {
      const seo = pageSeo({ lang, route });
      assert.ok(seo.title.startsWith(`${site.name} | `));
      assert.ok(seo.description.includes(site.name) || route.startsWith('/projects/'));
      assert.equal(seo.alternates.length, 7);
      assert.equal(new Set(seo.alternates.map(item => item.hreflang)).size, 7);
      assert.ok(seo.alternates.some(item => item.hreflang === lang && item.href === seo.canonical));
      for (const target of langs) {
        const peer = pageSeo({ lang: target, route });
        assert.deepEqual(peer.alternates, seo.alternates);
        assert.equal(seo.alternates.find(item => item.hreflang === `${target}-CH`).href, peer.canonical);
      }
      assert.equal(seo.ogLocale, `${lang}_CH`);
      assert.equal(seo.alternateOgLocales.length, 2);
      // Project names are intentionally the same across translations.
      if (!route.startsWith('/projects/')) {
        assert.ok(!titles.has(`${lang}:${seo.title}`));
        titles.add(`${lang}:${seo.title}`);
      }
    }
  }
  assert.equal(pageSeo({ lang: 'en', route: '/' }).canonical, `${site.domain}/`);
  assert.equal(pageSeo({ lang: 'it', route: '/' }).canonical, `${site.domain}/it`);
  assert.equal(pageSeo({ lang: 'de', route: '/about/' }).canonical, `${site.domain}/de/about`);
});

test('personal identity, portrait, Swiss location and current study are accurate across localized pages', () => {
  for (const lang of langs) {
    const seo = pageSeo({ lang, route: '/about' });
    const person = graphType(seo, 'Person');
    assert.equal(person['@id'], `${site.domain}/#person`);
    assert.equal(person.name, site.name);
    assert.deepEqual(person.sameAs, [site.linkedin, site.github]);
    assert.equal(person.homeLocation['@type'], 'City');
    assert.equal(person.homeLocation.address.addressCountry, 'CH');
    assert.equal(person.affiliation.name, 'University of Zurich');
    assert.match(person.description, /Currently pursuing an MSc/);
    assert.equal(person.alumniOf, undefined);
    assert.equal(person.worksFor, undefined);
    assert.equal(person.knowsLanguage, undefined);
    assert.ok(person.knowsAbout.includes('Python'));
    const profile = graphType(seo, 'ProfilePage');
    assert.equal(profile.inLanguage, lang);
    assert.deepEqual(profile.mainEntity, { '@id': person['@id'] });
    assert.deepEqual(graphType(seo, 'WebSite').inLanguage, langs);
    const portrait = seo.structuredData['@graph'].find(item => item['@id'] === person.image['@id']);
    assert.match(portrait.contentUrl, /\/images\/ciprian-loghin-zurich-about\.webp$/);
    assert.doesNotMatch(portrait.contentUrl, /logo/);
    assert.equal(portrait.width, 1448);
    assert.equal(seo.image.url, portrait.contentUrl);
    assert.match(seo.image.type, /^image\//);
  }
  assert.match(pageSeo({ lang: 'it' }).title, /Zurigo/);
  assert.match(pageSeo({ lang: 'de' }).description, /Zürich, Schweiz/);
});

test('project metadata uses the actual project cover, repository, notebook and PDF without fabricated publication dates', () => {
  for (const project of projects) {
    const entityIds = new Set();
    for (const lang of langs) {
      const seo = pageSeo({ lang, route: `/projects/${project.slug}` });
      const page = graphType(seo, 'WebPage');
      const work = graphType(seo, 'CreativeWork');
      entityIds.add(work['@id']);
      assert.equal(seo.description, project.description[lang]);
      assert.equal(work.name, project.title[lang]);
      assert.equal(work.sameAs, project.github);
      assert.equal(work.datePublished, undefined);
      assert.equal(work.dateModified, undefined);
      assert.deepEqual(page.mainEntity, { '@id': work['@id'] });
      assert.equal(page.inLanguage, lang);
      const notebook = work.hasPart.find(part => part['@type'] === 'SoftwareSourceCode');
      assert.equal(notebook.codeRepository, project.github);
      assert.equal(notebook.url, `${site.domain}/notebooks/${project.notebookFile}`);
      assert.equal(notebook.programmingLanguage, 'Python');
      const report = work.hasPart.find(part => part['@type'] === 'DigitalDocument');
      assert.equal(report.url, `${site.domain}${project.reportPdf}`);
      assert.equal(report.encodingFormat, 'application/pdf');
      assert.equal(seo.image.url, `${site.domain}${project.cover}`);
      assert.ok(seo.image.width > 0 && seo.image.height > 0);
      const crumbs = graphType(seo, 'BreadcrumbList').itemListElement;
      assert.equal(crumbs.length, 3);
      assert.equal(crumbs.at(-1).item, seo.canonical);
      assert.equal(crumbs.at(-1).name, project.title[lang]);
      assert.equal(crumbs[1].item, pageSeo({ lang, route: '/projects' }).canonical);
    }
    assert.equal(entityIds.size, 1, 'a project has one identity across translations');
  }
});

test('page types and localized breadcrumb labels represent the visible page', () => {
  assert.equal(graphType(pageSeo(), 'BreadcrumbList'), undefined);
  const list = graphType(pageSeo({ lang: 'it', route: '/projects' }), 'ItemList');
  assert.equal(list.itemListElement.length, projects.length);
  assert.equal(list.itemListElement[0].url, `${site.domain}/it/projects/${projects[0].slug}`);
  assert.ok(graphType(pageSeo({ route: '/projects' }), 'CollectionPage'));
  assert.ok(graphType(pageSeo({ route: '/certifications' }), 'CollectionPage'));
  assert.ok(graphType(pageSeo({ route: '/contact' }), 'ContactPage'));
  const crumbs = graphType(pageSeo({ lang: 'it', route: '/about' }), 'BreadcrumbList').itemListElement;
  assert.deepEqual(crumbs.map(item => item.name), ['Home', 'Chi sono']);
});

test('sitemap includes each canonical exactly once, with matching alternate links and no invented freshness', () => {
  const xml = sitemapXml([...routes, { route: '/about/' }]);
  assert.match(xml, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.equal((xml.match(/<loc>/g) || []).length, routes.length * langs.length);
  assert.equal((xml.match(/<xhtml:link /g) || []).length, routes.length * langs.length * 7);
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
  for (const lang of langs) {
    for (const route of routes) {
      const seo = pageSeo({ lang, route });
      const entry = urls.find(item => item.includes(`<loc>${seo.canonical}</loc>`));
      assert.ok(entry, seo.canonical);
      for (const alternate of seo.alternates) {
        assert.ok(entry.includes(`hreflang="${alternate.hreflang}" href="${alternate.href}"`));
      }
    }
  }
  assert.doesNotMatch(xml, /lastmod|changefreq|priority|crunchbase/);
});

test('fallback metadata stays unescaped for the rendering boundary and invalid canonical routes are rejected', () => {
  const seo = pageSeo({ lang: 'it', route: '/notes', title: 'Data & finance', description: 'Análisis <research>' });
  assert.equal(seo.title, `${site.name} | Data & finance`);
  assert.equal(seo.description, 'Análisis <research>');
  assert.throws(() => pageSeo({ lang: 'fr' }), /Unsupported SEO language/);
  for (const route of ['https://example.com/a', '//example.com/a', '/about?lang=en', '/about#intro', '/a/../about']) {
    assert.throws(() => pageSeo({ route }), /SEO routes/);
  }
});
