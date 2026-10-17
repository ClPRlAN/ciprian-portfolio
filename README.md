# Ciprian Loghin — Portfolio

Professional portfolio in English, Italian and German, with a warm light/dark theme and responsive navigation.

## Development

Use Node.js 24.19.0 (pinned in `.node-version`) and npm. The supported minimum is Node.js 22.12.0, as required by the HTML sanitizer. From the repository root:

```sh
npm ci
npm run build
npm test
npm run dev
```

The build generates `dist/` (ignored by Git). The development server listens on port 4173 and builds once when started. After edits, run `npm run build` and refresh the browser; restart the server if `dev.mjs` changes.

Cloudflare Workers Builds is connected to production branch `main` (confirmed by the public GitHub deployment check). Build with `npm ci && npm run build`, or `npm run build` when Cloudflare installs dependencies automatically; the static output is `dist`. Keep the existing deployment command and asset-directory settings in Cloudflare. The same build/output also works with Cloudflare Pages. Canonical domain: https://ciprianloghin.com.

## Source structure

- `content/data.mjs`: translated interface text, projects, certifications and academic qualifications.
- `content/notebooks/`: original notebook snapshots and `sources.json` with exact Git commits and SHA-256 hashes.
- `lib/notebook.mjs`: build-time Markdown/notebook rendering; code is displayed, never executed. HTML outputs are sanitized and embedded charts retained.
- `public/`: the CV, photos, logo, favicons, report PDFs and certificate/diploma PDFs.
- `src/styles.css`, `src/site.js`: design and browser interactions.
- `site.config.mjs`: personal links, current photos and Formspree configuration.
- `build.mjs`, `dev.mjs`: static build and local development server.

Only these source locations are authoritative. There is no nested duplicate application or tracked build output. The pages are Home, About, Projects, Certifications and Contact; routes are localized under `/it` and `/de`.

## Projects

Cultural Differences in Finance and Nasdaq Financial Data Analysis each have an internal page with a local notebook library, code, tables, saved charts and an embedded PDF report. GitHub and Colab remain optional external destinations. The Cultural Differences report is the supplied original PDF; the Nasdaq report is the existing project PDF.

Notebook content is a static snapshot in its original language. Viewing it requires no API key, account, Python runtime or external notebook request. Re-executing the source notebooks is separate: Cultural Differences requires the unpublished SPSS survey file; Nasdaq requires a Nasdaq API key in Colab Secrets.

To update a notebook, copy the new original `.ipynb` into `content/notebooks/`, then update its pinned commit/source URLs, SHA-256 and metadata in `sources.json`. The build rejects mismatched hashes. Cards currently use real charts from the saved notebooks; future project photographs can replace their `cover` paths. The About page uses the supplied laptop photograph; the homepage uses the supplied finance-themed photograph.

## Contact and documents

The form uses Formspree `mrpbqerd`; successful submission replaces the form with a translated confirmation. Never place API secrets in the static site. The phone is revealed on request. The public CV URL is `/Ciprian_Loghin_CV.pdf`.

Certificates and academic qualifications link to original PDFs. Years on the diplomas refer to completion (Bachelor 2024; vocational diploma 2018), rather than later document issue dates. The favicon set is crawlable at stable root URLs; search-engine refresh timing is outside the site's control.

## Validation

`npm test` checks notebook rendering/sanitization and generated pages/assets. Run `npm run build` first for generated-page checks. The mobile menu, theme, local notebook scrolling, PDF responses, translated navigation and mocked Formspree success/error states are also checked during browser validation. A real Formspree submission is not part of automated tests.

## Search visibility

`lib/seo.mjs` generates localized titles, canonical URLs, global and Swiss hreflang links, social metadata and connected structured data. `docs/SEO.md` records deployment/Search Console checks and the limits of local validation. Fonts are served locally from pinned Fontsource packages with their licenses.
