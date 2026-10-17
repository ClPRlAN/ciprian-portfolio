# Search visibility for Ciprian Loghin

The site is a personal portfolio for a Business & Financial Analyst based in Zurich, Switzerland, currently pursuing an MSc in Data Science & Finance at the University of Zurich. Metadata must continue to reflect that status accurately. Search placement is decided by Google; technical improvements cannot guarantee first place or a particular indexing date.

## Implemented

- A visible personal-name H1 on the homepage, with the professional slogan retained and a visible localized Zurich/Switzerland location.
- Name-first page titles and unique translated metadata for English, Italian and German pages.
- Self-referencing canonical URLs and reciprocal `en`, `it`, `de`, `en-CH`, `it-CH`, `de-CH` and `x-default` links in both page heads and the sitemap. The Swiss aliases point to the existing translated pages; there are no artificial duplicate country pages.
- Connected `Person`, `WebSite`, `ProfilePage`, page, breadcrumb and project structured data. The identity uses a real portrait, Zurich as the home city, the existing LinkedIn/GitHub profiles and the current university affiliation. It does not claim an awarded MSc, a bank employer, a street address, reviews or a LocalBusiness.
- A crawlable favicon set, raster social images, localized Open Graph text and large-image preview permission.
- Static HTML content visible without JavaScript; readable local project notebooks and genuine reports.
- Locally served WOFF2 fonts, font preloads, image dimensions and priority loading for the initial photograph. Font licenses ship with the generated assets.

## After deployment

The production branch is `main`. Pushing `portfolio-v5-cleanup` prepares review; it does not change the live website.

1. Merge the reviewed changes and confirm the Cloudflare production deployment succeeds. The build command remains `npm run build` with npm dependencies installed from the lockfile.
2. Check the public HTTPS pages, canonical URLs, redirects from HTTP and `www`, `robots.txt`, sitemap and absence of a production `noindex` response/header. Redirect behavior must be verified at the deployed host; do not infer it from the local server. Check that any `*.pages.dev` host either redirects to the canonical domain or is excluded from indexing without blocking the real domain.
3. In the verified Google Search Console domain property for `ciprianloghin.com`, submit `https://ciprianloghin.com/sitemap.xml`. Use URL Inspection on the homepage and About page after deployment, inspect Google's selected canonical and request indexing where available. Domain-property ownership may require a DNS TXT record in the domain provider. No verification token is stored or invented in this repository.
4. Validate the deployed structured data using Google's Rich Results Test and Schema.org Validator. Valid data is not a guarantee of a rich result.
5. Keep the website link and name consistent on the existing LinkedIn and GitHub profiles. Relevant genuine mentions and links from professional/academic profiles can help Google distinguish this person from namesakes; avoid purchased links or fabricated local landing pages.
6. Monitor branded queries such as `Ciprian Loghin` in Search Console, filter the country to Switzerland and compare the English, Italian and German pages. Use real query/impression/click data to guide further changes.

Public-host checks and Google's documentation hosts were blocked by the cloud environment's outbound proxy with `403 CONNECT` during this task. That response is from the environment and does not establish a problem with the website, DNS or Google's access. Local generated-site checks are recorded separately; actual Google indexing and rankings were not verified.

Official references for review: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [localized pages and hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions), [profile structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
