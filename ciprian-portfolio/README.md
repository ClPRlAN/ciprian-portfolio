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

The contact form is already configured with the current Formspree form ID in `site.config.mjs`. If you ever replace the form, update `formspreeId` there.

## Cloudflare build

- Build command: `npm run build`
- Output directory: `dist`


## Current visual refinements

- Centered desktop navigation with balanced left/right columns
- Responsive max-width container for more consistent desktop layouts
- Light/dark favicons
- Home About preview image
- Contact-form success state that replaces the form after submission
- Two real projects only; no placeholder project
