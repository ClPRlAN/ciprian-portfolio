import { site } from '../site.config.mjs';
import { languages, projects, skills, ui } from '../content/data.mjs';

const origin = site.domain.replace(/\/$/, '');
const personId = `${origin}/#person`;
const websiteId = `${origin}/#website`;
const portraitId = `${origin}/#portrait`;
const portraitPath = '/images/ciprian-loghin-zurich-about.webp';
const projectImageSizes = {
  'cultural-differences-in-finance': [771, 471],
  'nasdaq-financial-data-analysis': [980, 590]
};

const text = {
  en: {
    homeTitle: 'Business & Financial Analyst in Zurich',
    aboutTitle: 'About me · Zurich, Switzerland',
    home: 'Ciprian Loghin, Business & Financial Analyst based in Zurich, Switzerland. Currently pursuing an MSc in Data Science & Finance at the University of Zurich.',
    about: 'Meet Ciprian Loghin, a Zurich-based Business & Financial Analyst and MSc Data Science & Finance student at the University of Zurich. Background, skills and approach.',
    projects: 'Explore Ciprian Loghin’s finance and data analysis projects. Read the Python notebooks, charts and full project reports directly on the site.',
    certifications: 'Ciprian Loghin’s professional certifications and academic qualifications in business, data and technology, with original certificates and diplomas.',
    contact: 'Contact Ciprian Loghin, Business & Financial Analyst based in Zurich, Switzerland, about professional opportunities and collaborations.',
    portraitAlt: 'Ciprian Loghin working at a laptop',
    chartAlt: 'Project analysis chart',
    report: 'Project report',
    notebook: 'Python notebook'
  },
  it: {
    homeTitle: 'Business & Financial Analyst a Zurigo',
    aboutTitle: 'Chi sono · Zurigo, Svizzera',
    home: 'Ciprian Loghin, Business & Financial Analyst a Zurigo, Svizzera. Attualmente frequenta l’MSc in Data Science & Finance presso l’Università di Zurigo.',
    about: 'Conosci Ciprian Loghin, Business & Financial Analyst a Zurigo e studente MSc in Data Science & Finance all’Università di Zurigo. Percorso, competenze e metodo.',
    projects: 'Esplora i progetti di finanza e analisi dati di Ciprian Loghin. Consulta notebook Python, grafici e report completi direttamente sul sito.',
    certifications: 'Certificazioni professionali e titoli di studio di Ciprian Loghin in business, dati e tecnologia, con certificati e diplomi originali.',
    contact: 'Contatta Ciprian Loghin, Business & Financial Analyst a Zurigo, Svizzera, per opportunità professionali e collaborazioni.',
    portraitAlt: 'Ciprian Loghin al lavoro al computer',
    chartAlt: 'Grafico di analisi del progetto',
    report: 'Report del progetto',
    notebook: 'Notebook Python'
  },
  de: {
    homeTitle: 'Business & Financial Analyst in Zürich',
    aboutTitle: 'Über mich · Zürich, Schweiz',
    home: 'Ciprian Loghin, Business & Financial Analyst in Zürich, Schweiz. Derzeit MSc-Student in Data Science & Finance an der Universität Zürich.',
    about: 'Lernen Sie Ciprian Loghin kennen: Business & Financial Analyst in Zürich und MSc-Student in Data Science & Finance an der Universität Zürich. Werdegang und Kompetenzen.',
    projects: 'Entdecken Sie die Finanz- und Datenanalyseprojekte von Ciprian Loghin. Python-Notebooks, Diagramme und vollständige Projektberichte direkt auf der Website lesen.',
    certifications: 'Berufliche Zertifizierungen und Bildungsabschlüsse von Ciprian Loghin in Business, Daten und Technologie, mit Originalzertifikaten und Diplomen.',
    contact: 'Kontaktieren Sie Ciprian Loghin, Business & Financial Analyst in Zürich, Schweiz, für berufliche Möglichkeiten und Zusammenarbeit.',
    portraitAlt: 'Ciprian Loghin bei der Arbeit am Laptop',
    chartAlt: 'Analysediagramm des Projekts',
    report: 'Projektbericht',
    notebook: 'Python-Notebook'
  }
};

function normalizeRoute(route = '/') {
  if (typeof route !== 'string' || /[?#]/.test(route) || route.includes('://') || route.startsWith('//')) {
    throw new TypeError('SEO routes must be site-relative paths without a query or fragment');
  }
  const normalized = `/${route.replace(/^\/+|\/+$/g, '')}`;
  if (normalized.split('/').some(segment => segment === '.' || segment === '..')) {
    throw new TypeError('SEO routes must not contain relative path segments');
  }
  return normalized;
}

function urlFor(lang, route) {
  const prefix = languages[lang].prefix;
  return `${origin}${prefix}${route === '/' ? (prefix ? '' : '/') : route}`;
}

function alternatesFor(route) {
  return [
    ...Object.keys(languages).flatMap(lang => [
      { hreflang: lang, href: urlFor(lang, route) },
      { hreflang: `${lang}-CH`, href: urlFor(lang, route) }
    ]),
    { hreflang: 'x-default', href: urlFor('en', route) }
  ];
}

function imageFor(project, lang) {
  if (project?.cover) {
    const [width, height] = projectImageSizes[project.slug] || [];
    return {
      url: new URL(project.cover, `${origin}/`).href,
      ...(width && height ? { width, height } : {}),
      type: project.cover.endsWith('.png') ? 'image/png' : 'image/webp',
      alt: `${project.title[lang]} — ${text[lang].chartAlt}`
    };
  }
  return {
    url: `${origin}${portraitPath}`,
    width: 1448,
    height: 1086,
    type: 'image/webp',
    alt: text[lang].portraitAlt
  };
}

/**
 * Metadata for an unlocalized route (e.g. /about or /projects/a-project).
 * Known routes use concise, translated metadata; title/description are fallbacks
 * for additional routes. A project can be supplied or is found by its route.
 * Returns plain, unescaped values: escape HTML/XML at the rendering boundary and
 * replace '<' with '\\u003c' when embedding structuredData as an inline script.
 * Canonicals retain the site's existing paths: '/', '/it', '/de', '/about', etc.
 */
export function pageSeo({ lang = 'en', route = '/', title, description, project } = {}) {
  if (!Object.hasOwn(languages, lang)) throw new TypeError(`Unsupported SEO language: ${lang}`);
  route = normalizeRoute(route);
  project ||= projects.find(item => route === `/projects/${item.slug}`);
  const t = text[lang];
  const nav = ui[lang].nav;
  const pageTitles = {
    '/': t.homeTitle,
    '/about': t.aboutTitle,
    '/projects': nav.projects,
    '/certifications': nav.certifications,
    '/contact': nav.contact
  };
  const descriptions = {
    '/': t.home,
    '/about': t.about,
    '/projects': t.projects,
    '/certifications': t.certifications,
    '/contact': t.contact
  };
  const topic = project?.title[lang] || pageTitles[route] || title;
  const fullTitle = topic ? `${site.name} | ${topic}` : site.name;
  const summary = project?.description[lang] || descriptions[route] || description || t.home;
  const canonical = urlFor(lang, route);
  const image = imageFor(project, lang);
  const pageId = `${canonical}#webpage`;
  const imageId = project?.cover ? `${image.url}#image` : portraitId;
  const pageType = route === '/about' ? 'ProfilePage'
    : ['/projects', '/certifications'].includes(route) ? 'CollectionPage'
      : route === '/contact' ? 'ContactPage' : 'WebPage';
  const graph = [
    {
      '@type': 'Person',
      '@id': personId,
      name: site.name,
      url: `${origin}/`,
      image: { '@id': portraitId },
      jobTitle: 'Business & Financial Analyst',
      description: text.en.home,
      sameAs: [site.linkedin, site.github],
      homeLocation: {
        '@type': 'City',
        name: 'Zurich',
        address: { '@type': 'PostalAddress', addressLocality: 'Zurich', addressCountry: 'CH' }
      },
      affiliation: {
        '@type': 'CollegeOrUniversity',
        name: 'University of Zurich',
        url: 'https://www.uzh.ch/'
      },
      knowsAbout: [...skills.business, ...skills.data],
      mainEntityOfPage: { '@id': `${urlFor('en', '/about')}#webpage` }
    },
    {
      '@type': 'ImageObject',
      '@id': portraitId,
      url: `${origin}${portraitPath}`,
      contentUrl: `${origin}${portraitPath}`,
      width: 1448,
      height: 1086,
      caption: t.portraitAlt
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: site.name,
      url: `${origin}/`,
      inLanguage: Object.keys(languages),
      publisher: { '@id': personId }
    },
    {
      '@type': pageType,
      '@id': pageId,
      url: canonical,
      name: fullTitle,
      description: summary,
      inLanguage: lang,
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
      primaryImageOfPage: { '@id': imageId },
      ...(route === '/' || route === '/about' ? { mainEntity: { '@id': personId } } : {})
    }
  ];
  const page = graph.at(-1);

  if (route !== '/') {
    const crumbs = [{ '@type': 'ListItem', position: 1, name: nav.home, item: urlFor(lang, '/') }];
    if (project) crumbs.push({ '@type': 'ListItem', position: 2, name: nav.projects, item: urlFor(lang, '/projects') });
    crumbs.push({
      '@type': 'ListItem',
      position: crumbs.length + 1,
      name: project?.title[lang] || ({ '/about': nav.about, '/projects': nav.projects, '/certifications': nav.certifications, '/contact': nav.contact })[route] || title || site.name,
      item: canonical
    });
    const breadcrumbId = `${canonical}#breadcrumb`;
    page.breadcrumb = { '@id': breadcrumbId };
    graph.push({ '@type': 'BreadcrumbList', '@id': breadcrumbId, itemListElement: crumbs });
  }

  if (route === '/projects') {
    const listId = `${canonical}#projects`;
    page.mainEntity = { '@id': listId };
    graph.push({
      '@type': 'ItemList', '@id': listId,
      itemListElement: projects.map((item, index) => ({
        '@type': 'ListItem', position: index + 1,
        name: item.title[lang], url: urlFor(lang, `/projects/${item.slug}`)
      }))
    });
  }

  if (project) {
    const projectId = `${urlFor('en', `/projects/${project.slug}`)}#project`;
    page.about = { '@id': projectId };
    page.mainEntity = { '@id': projectId };
    graph.push({
      '@type': 'CreativeWork', '@id': projectId,
      name: project.title[lang], description: project.description[lang],
      url: canonical, image: { '@id': imageId },
      ...(project.github ? { sameAs: project.github } : {}),
      hasPart: [
        {
          '@type': 'SoftwareSourceCode',
          name: `${project.title[lang]} — ${t.notebook}`,
          url: `${origin}/notebooks/${project.notebookFile}`,
          codeRepository: project.github,
          ...(project.tools.includes('Python') ? { programmingLanguage: 'Python' } : {})
        },
        {
          '@type': 'DigitalDocument',
          name: `${project.title[lang]} — ${t.report}`,
          url: new URL(project.reportPdf, `${origin}/`).href,
          encodingFormat: 'application/pdf'
        }
      ]
    });
    if (imageId !== portraitId) graph.push({
      '@type': 'ImageObject', '@id': imageId,
      url: image.url, contentUrl: image.url,
      ...(image.width ? { width: image.width, height: image.height } : {}),
      caption: image.alt
    });
  }

  return {
    title: fullTitle,
    description: summary,
    canonical,
    alternates: alternatesFor(route),
    ogLocale: `${lang}_CH`,
    alternateOgLocales: Object.keys(languages).filter(value => value !== lang).map(value => `${value}_CH`),
    image,
    structuredData: { '@context': 'https://schema.org', '@graph': graph }
  };
}

const xmlEscape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);

/**
 * Build the complete sitemap from unlocalized routes, as strings or { route }
 * objects. Each route produces EN/IT/DE URLs with reciprocal language and Swiss
 * hreflang links. Duplicate routes are removed; no artificial lastmod is added.
 */
export function sitemapXml(routes) {
  const uniqueRoutes = [...new Set(routes.map(entry => normalizeRoute(typeof entry === 'string' ? entry : entry.route)))];
  const entries = uniqueRoutes.flatMap(route => Object.keys(languages).map(lang => {
    const links = alternatesFor(route).map(({ hreflang, href }) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${xmlEscape(href)}"/>`).join('\n');
    return `  <url>\n    <loc>${xmlEscape(urlFor(lang, route))}</loc>\n${links}\n  </url>`;
  }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}
