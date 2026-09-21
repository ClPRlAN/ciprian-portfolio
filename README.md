# Ciprian Loghin — Portfolio

Static multi-page portfolio prepared for GitHub + Cloudflare Workers/Pages.

## Included

- EN / IT / DE
- Warm light/dark mode
- Responsive navigation
- Home, About, Projects, Presentations, Research, Certifications and Contact
- Dedicated project and presentation pages
- Real hero/About photos and personal logo
- Real presentation, research and certification PDFs
- PDF cover previews on cards
- GitHub + Colab links for analytical projects
- CV download
- SEO metadata, sitemap and robots.txt

## Build

```bash
npm run build
```

Output: `dist/`

## Preview

```bash
npm run dev
```

Open `http://localhost:4173`.

## Main content files

- `content/data.mjs` — portfolio text and content metadata
- `site.config.mjs` — personal links, images, CV and Formspree configuration
- `src/styles.css` — visual system
- `src/site.js` — interactions
- `public/images/` — website images and previews
- `public/pdfs/` — presentations, research and certificates

## Contact form

Create a Formspree form and replace `YOUR_FORM_ID` in `site.config.mjs`.

## Cloudflare build

- Build command: `npm run build`
- Output directory: `dist`
