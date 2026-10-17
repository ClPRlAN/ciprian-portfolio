import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { languages, projects, certifications } from '../content/data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filename) : [filename];
  });
}
const pages = walk(dist).filter(filename => filename.endsWith('/index.html'));

test('all localized pages, metadata and internal resources are complete', () => {
  assert.equal(pages.length, 21);
  for (const filename of pages) {
    const html = fs.readFileSync(filename, 'utf8');
    const relative = path.relative(dist, filename);
    const language = relative.startsWith('it/') ? 'it' : relative.startsWith('de/') ? 'de' : 'en';
    assert.ok(html.includes(`<html lang="${language}">`), relative);
    assert.match(html, /<link rel="canonical" href="https:\/\/ciprianloghin.com\//);
    assert.match(html, /<h1[ >]/);
    assert.doesNotMatch(html, /(?:href|src)="\/(?:it\/|de\/)?(?:presentations|research)(?:\/|")|crunchbase|YOUR_FORM_ID|>undefined<|="undefined"/i);
    for (const [,url] of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
      const local = path.join(dist, decodeURIComponent(url));
      assert.ok(fs.existsSync(local), `${relative}: missing ${url}`);
      if (fs.statSync(local).isDirectory()) assert.ok(fs.existsSync(path.join(local, 'index.html')), url);
    }
    for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${id}"`), `${relative}: missing anchor ${id}`);
    }
  }
});

test('project pages contain original cells, charts and a local embedded report', () => {
  for (const project of projects) {
    const notebook = JSON.parse(fs.readFileSync(path.join(root, 'content/notebooks', project.notebookFile)));
    const chartCount = notebook.cells.flatMap(c => c.outputs || []).filter(o => o.data?.['image/png']).length;
    for (const language of Object.values(languages)) {
      const html = fs.readFileSync(path.join(dist, language.prefix, 'projects', project.slug, 'index.html'), 'utf8');
      assert.equal((html.match(/class="nb-cell /g) || []).length, notebook.cells.length);
      assert.equal((html.match(/src="data:image\/png;base64,/g) || []).length, chartCount);
      assert.ok(html.includes(`<iframe src="${project.reportPdf}#view=FitH"`));
      assert.ok(html.includes(`href="/notebooks/${project.notebookFile}" download`));
      assert.doesNotMatch(html, /data-notebook-url=|<script[^>]*src="https:\/\/(?:raw\.)?github/);
    }
    assert.equal(fs.readFileSync(path.join(dist, project.reportPdf)).subarray(0,5).toString(), '%PDF-');
    assert.deepEqual(fs.readFileSync(path.join(dist, 'notebooks', project.notebookFile)), fs.readFileSync(path.join(root, 'content/notebooks', project.notebookFile)));
  }
});

test('certificates, qualifications, CV, contact and favicon destinations are published', () => {
  for (const certificate of certifications) {
    assert.equal(fs.readFileSync(path.join(dist, certificate.pdf)).subarray(0,5).toString(), '%PDF-');
    for (const language of Object.values(languages)) {
      const html = fs.readFileSync(path.join(dist, language.prefix, 'certifications/index.html'), 'utf8');
      assert.ok(html.includes(`href="${certificate.pdf}"`));
      assert.ok(html.includes(certificate.title));
    }
  }
  for (const language of Object.values(languages)) {
    const html = fs.readFileSync(path.join(dist, language.prefix, 'contact/index.html'), 'utf8');
    assert.ok(html.includes('action="https://formspree.io/f/mrpbqerd"'));
    assert.ok(html.includes('data-contact-success'));
    assert.ok(html.includes('href="/Ciprian_Loghin_CV.pdf"'));
  }
  for (const file of ['favicon.ico','favicon-48.png','favicon-96.png','favicon-light.png','favicon-dark.png','apple-touch-icon.png']) {
    assert.ok(fs.statSync(path.join(dist,file)).size > 0);
  }
  const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<loc>/g) || []).length, 21);
  assert.doesNotMatch(sitemap, /crunchbase|presentations|research/);
});
