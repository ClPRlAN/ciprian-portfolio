import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderNotebook } from '../lib/notebook.mjs';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC1kAAAAASUVORK5CYII=';
const jpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';
const notebook = cells => ({ nbformat: 4, metadata: { language_info: { name: 'python' } }, cells });
const codeCell = outputs => ({ cell_type: 'code', execution_count: 7, source: ['x = 1\n', 'print(x)'], outputs });
const count = (text, expression) => [...text.matchAll(expression)].length;

test('Markdown produces headings, paragraphs, tables, lists, links and escaped fenced code', () => {
  const html = renderNotebook(notebook([{
    cell_type: 'markdown', source: [
      '# Findings\n\nA **strong** result with `x < 2`.\n\n',
      '| Country | Score |\n| --- | ---: |\n| Switzerland | 42 |\n\n',
      '- First\n- Second\n\n[Source](https://example.com/research)\n\n',
      '```python\nprint("<script>alert(1)</script>")\n```'
    ]
  }]));
  assert.match(html, /<h1>Findings<\/h1>/);
  assert.match(html, /<strong>strong<\/strong>/);
  assert.match(html, /<code>x &lt; 2<\/code>/);
  assert.match(html, /<table>[\s\S]*<th>Country<\/th>[\s\S]*<td>Switzerland<\/td>/);
  assert.equal(count(html, /<li>/g), 2);
  assert.match(html, /href="https:\/\/example.com\/research" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /<code class="language-python">print\("&lt;script&gt;alert\(1\)&lt;\/script&gt;"\)/);
  assert.doesNotMatch(html, /<script>/);
});

test('Code and raw cells stay literal; streams, errors and multiline outputs retain readable text', () => {
  const html = renderNotebook(notebook([
    { ...codeCell([
      { output_type: 'stream', name: 'stdout', text: ['first\n', 'second <value>\n'] },
      { output_type: 'error', ename: 'ValueError', evalue: 'bad', traceback: ['\u001b[31mValueError\u001b[0m', 'line <3>'] },
      { output_type: 'execute_result', data: { 'text/plain': ['a\n', 'b & c'] } }
    ]), source: 'print("<img onerror=alert(1)>")' },
    { cell_type: 'raw', source: '# Literal\n<script>not executable</script>' }
  ]), { codeLabel: 'Codice', outputLabel: 'Risultato', rawLabel: 'Testo grezzo' });
  assert.match(html, /Codice \[7\]/);
  assert.match(html, /Risultato/);
  assert.match(html, /&lt;img onerror=alert\(1\)&gt;/);
  assert.match(html, /first\nsecond &lt;value&gt;\n/);
  assert.match(html, /ValueError\nline &lt;3&gt;/);
  assert.match(html, /a\nb &amp; c/);
  assert.match(html, /Testo grezzo<\/div><pre class="nb-code"># Literal\n&lt;script&gt;not executable&lt;\/script&gt;/);
  assert.doesNotMatch(html, /\u001b|<img|<script|<h1>/);
});

test('Saved raster charts and HTML tables take precedence over plain-text MIME fallbacks', () => {
  const html = renderNotebook(notebook([codeCell([
    { output_type: 'display_data', data: { 'image/png': [png.slice(0, 30), '\n', png.slice(30)], 'text/html': '<p>HTML fallback</p>', 'text/plain': '<Figure fallback>' } },
    { output_type: 'display_data', data: { 'image/jpeg': jpeg, 'text/plain': 'JPEG fallback' } },
    { output_type: 'execute_result', data: { 'text/html': ['<style>body{display:none}</style>', '<table class="dataframe"><thead><tr><th>beta</th></tr></thead><tbody><tr><td>0.42</td></tr></tbody></table>'], 'text/plain': 'table fallback' } }
  ])]), { imageAlt: 'Grafico salvato' });
  assert.equal(count(html, /<img /g), 2);
  assert.match(html, /src="data:image\/png;base64,/);
  assert.match(html, /src="data:image\/jpeg;base64,/);
  assert.match(html, /alt="Grafico salvato"/);
  assert.match(html, /<table class="dataframe">[\s\S]*<td>0.42<\/td>/);
  assert.doesNotMatch(html, /fallback|<style|display:none/);
});

test('Markdown notebook attachments render locally while external and unsafe images are removed', () => {
  const html = renderNotebook(notebook([{
    cell_type: 'markdown',
    source: '![Chart](attachment:chart%20one.png)\n\n![Remote](https://example.com/tracker.png)\n\n<img src="attachment:photo.jpg" onerror="alert(1)">',
    attachments: { 'chart one.png': { 'image/png': png }, 'photo.jpg': { 'image/jpeg': jpeg } }
  }]));
  assert.equal(count(html, /<img /g), 2);
  assert.match(html, /alt="Chart"/);
  assert.doesNotMatch(html, /https:\/\/example.com|onerror|attachment:/);
});

test('Unsafe HTML, event handlers, attributes, URL schemes and remote browser resources cannot survive', () => {
  const attack = [
    '<script>alert("script")</script><style>body{color:red}</style>',
    '<iframe src="https://example.com/frame">frame</iframe><object data="https://example.com/object">object</object>',
    '<svg><script>alert("svg")</script><a href="javascript:alert(1)">svg</a></svg>',
    '<table onclick="alert(1)" style="background:url(https://example.com/css)"><tr><td>Safe cell</td></tr></table>',
    '<a href="javascript:alert(1)">bad</a><a href="java&#x0a;script:alert(1)">obfuscated</a>',
    '<a href="data:text/html;base64,PHNjcmlwdD4=">data link</a><a href="//example.com">protocol relative</a>',
    '<a href="https://example.com/report" target="_top" onclick="alert(1)">Good source</a>',
    '<a href="#section">Section</a><a href="/projects">Projects</a><a href="mailto:hello@example.com">Email</a>',
    '<img src="https://example.com/tracker" srcset="https://example.com/tracker2 2x" onerror="alert(1)">',
    '<img src="data:image/svg+xml;base64,PHN2Zy8+"><img src="data:text/html;base64,PHNjcmlwdD4=">',
    `<img src="data:image/png;base64,${Buffer.from('<script>alert(1)</script>').toString('base64')}">`,
    `<img src="data:image/png;base64,${png}" onload="alert(1)" style="display:none">`,
    '<form action="https://example.com"><input autofocus onfocus="alert(1)"></form>'
  ].join('\n');
  const html = renderNotebook(notebook([codeCell([{ output_type: 'display_data', data: { 'text/html': attack } }])]));
  assert.match(html, /<td>Safe cell<\/td>/);
  assert.match(html, /href="https:\/\/example.com\/report" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="#section"/);
  assert.match(html, /href="\/projects"/);
  assert.match(html, /href="mailto:hello@example.com"/);
  assert.equal(count(html, /<img /g), 1);
  assert.doesNotMatch(html, /<(?:script|style|iframe|object|svg|form|input)\b|\bon(?:click|load|error|focus)=|\b(?:style|srcset)=|javascript:|java&#|data:text|data:image\/svg|_top/);
  assert.doesNotMatch(html, /(?:src|href)="\/\/|src="https?:/);
});

test('Invalid raster data and stripped HTML fall back to text; unsupported MIME data is inert', () => {
  const html = renderNotebook(notebook([codeCell([
    { output_type: 'display_data', data: { 'image/png': 'not base64!', 'text/plain': 'Broken chart fallback' } },
    { output_type: 'display_data', data: { 'text/html': '<script>alert(1)</script>', 'text/plain': 'Unsafe HTML fallback' } },
    { output_type: 'display_data', data: { 'application/javascript': 'alert(2)', 'image/svg+xml': '<svg onload="alert(3)"/>' } },
    { output_type: 'error', ename: 'Error', evalue: '<script>bad</script>' }
  ])]));
  assert.match(html, /Broken chart fallback/);
  assert.match(html, /Unsafe HTML fallback/);
  assert.match(html, /Error: &lt;script&gt;bad&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<img|alert\([123]\)|<svg|<script/);
  assert.throws(() => renderNotebook({}), /cells array/);
});

for (const name of ['cultural-differences-in-finance', 'nasdaq-financial-data-analysis']) {
  test(`Real ${name} snapshot preserves all cells, code, saved tables and raster charts`, () => {
    const source = JSON.parse(readFileSync(new URL(`../content/notebooks/${name}.ipynb`, import.meta.url), 'utf8'));
    const html = renderNotebook(source);
    const outputs = source.cells.flatMap(cell => cell.outputs || []);
    const imageCount = outputs.filter(output => output.data?.['image/png'] || output.data?.['image/jpeg']).length;
    const tableCount = outputs.filter(output => output.data?.['text/html']).length;
    assert.equal(count(html, /class="nb-cell /g), source.cells.length);
    assert.equal(count(html, /class="nb-cell nb-code-cell"/g), source.cells.filter(cell => cell.cell_type === 'code').length);
    assert.equal(count(html, /class="nb-output nb-image"/g), imageCount);
    assert.equal(count(html, /<table\b/g), tableCount);
    assert.match(html, /class="nb-markdown"|class="nb-cell nb-markdown"/);
    assert.doesNotMatch(html, /<(?:script|style|iframe|button|svg)\b|\bonclick=|src="https?:|<Figure /);
    // Python source remains displayed verbatim rather than interpreted as HTML.
    for (const cell of source.cells.filter(cell => cell.cell_type === 'code')) {
      const text = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      const escaped = text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
      assert.ok(html.includes(escaped));
    }
  });
}
