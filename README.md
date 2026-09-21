# Ciprian Loghin — Portfolio

A zero-dependency static portfolio built for GitHub + Cloudflare Pages.

## What is already included

- Multi-page portfolio
- English / Italian / German URLs
- Light / dark mode with remembered preference
- Home smooth-scroll navigation
- Dedicated About, Projects, Presentations, Research, Certifications and Contact pages
- Dedicated page for every project and presentation
- Two real GitHub projects populated from their public READMEs
- CV included as `public/Ciprian_Loghin_CV.pdf`
- Responsive layout
- SEO metadata, sitemap, robots.txt and social sharing card
- Contact form markup prepared for Formspree

## Preview locally

Install Node 18+ and run:

```bash
npm run dev
```

Then open `http://localhost:4173`.

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Cloudflare Pages settings

- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18 or newer

## Replace the hero photo

Replace:

`public/assets/hero-photo-placeholder.svg`

with your image, for example:

`public/images/ciprian-hero.jpg`

Then change `heroImage` in `site.config.mjs` to:

```js
heroImage: "/images/ciprian-hero.jpg"
```

The CSS fade is already applied automatically and does not split the image into multiple elements.

## Replace the logo

Put the logo inside `public/images/`, then update `logoImage` in `site.config.mjs`.

## Connect Formspree

1. Create a free Formspree form.
2. Copy the form ID from its endpoint, e.g. `https://formspree.io/f/abcdwxyz` -> `abcdwxyz`.
3. Open `site.config.mjs`.
4. Replace `YOUR_FORM_ID` with the real ID.
5. Rebuild / push to GitHub.

Until configured, the site prevents fake submission and asks visitors to use email instead.

## Add or edit portfolio content

Edit `content/data.mjs`.

The arrays are:

- `projects`
- `presentations`
- `research`
- `certifications`

The build automatically creates pages from those entries.

### Add a presentation PDF

Put the PDF in `public/pdfs/` and set the item's `pdf` field, e.g.:

```js
pdf: "/pdfs/smarteats-business-plan.pdf"
```

### Add a research PDF

Same approach: upload to `public/pdfs/` and set the `pdf` path in the research item.

## Domain

The production domain is already configured in site metadata as:

`https://ciprianloghin.com`

The DNS connection to Cloudflare Pages is done only after the GitHub deployment is live.
