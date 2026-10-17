import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

// Notebook multiline strings may be either a single string or an array of lines.
const notebookText = value => Array.isArray(value) ? value.join('') : typeof value === 'string' ? value : '';
const stripAnsi = value => value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');

function rasterDataUrl(mime, value) {
  if (!['image/png', 'image/jpeg'].includes(mime)) return '';
  const encoded = notebookText(value).replace(/\s/g, '');
  if (!encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 === 1) return '';
  const bytes = Buffer.from(encoded, 'base64');
  // Re-encoding rejects malformed base64 instead of relying on Buffer's permissive decoder.
  if (bytes.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) return '';
  const valid = mime === 'image/png'
    ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return valid ? `data:${mime};base64,${bytes.toString('base64')}` : '';
}

function safeImageSource(source, attachments = {}) {
  if (typeof source !== 'string') return '';
  if (source.startsWith('attachment:')) {
    const name = source.slice('attachment:'.length);
    let decodedName = name;
    try { decodedName = decodeURIComponent(name); } catch { /* Treat malformed escaping as a literal filename. */ }
    const attachment = attachments[name] || attachments[decodedName];
    if (!attachment || typeof attachment !== 'object') return '';
    return rasterDataUrl('image/png', attachment['image/png']) || rasterDataUrl('image/jpeg', attachment['image/jpeg']);
  }
  const match = /^data:(image\/(?:png|jpeg));base64,([\s\S]+)$/i.exec(source);
  return match ? rasterDataUrl(match[1].toLowerCase(), match[2]) : '';
}

function cleanHtml(html, attachments = {}) {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre', 'code',
      'div', 'span', 'br', 'hr', 'strong', 'em', 'b', 'i', 's', 'del', 'u',
      'sub', 'sup', 'kbd', 'samp', 'mark', 'small', 'abbr', 'a', 'img',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot',
      'tr', 'th', 'td', 'caption', 'colgroup', 'col', 'figure', 'figcaption',
      'details', 'summary'
    ],
    allowedAttributes: {
      '*': ['title'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'loading', 'decoding'],
      code: ['class'],
      table: ['class'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      ol: ['start'],
      li: ['value'],
      col: ['span'],
      colgroup: ['span']
    },
    allowedClasses: { code: [/^language-[A-Za-z0-9_-]+$/], table: ['dataframe'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['data'] },
    allowProtocolRelative: false,
    nonTextTags: ['script', 'style', 'textarea', 'option', 'iframe', 'object', 'embed', 'svg', 'math', 'template', 'noscript'],
    transformTags: {
      a: (tagName, attributes) => {
        const { href, title } = attributes;
        return {
          tagName,
          attribs: {
            ...(href ? { href } : {}), ...(title ? { title } : {}),
            ...(/^https?:\/\//i.test(href || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})
          }
        };
      },
      img: (tagName, attributes) => ({
        tagName,
        attribs: {
          src: safeImageSource(attributes.src, attachments),
          alt: attributes.alt || '',
          loading: 'lazy', decoding: 'async'
        }
      })
    },
    // Only embedded raster images can reach the browser. No remote resources, SVG,
    // event handlers, inline CSS, frames, forms, scripts, or Colab widgets survive.
    exclusiveFilter: frame => frame.tag === 'img' && !frame.attribs.src
  });
}

const markdown = new Marked({ gfm: true, breaks: false, async: false });
function renderMarkdown(source, attachments) {
  return cleanHtml(markdown.parse(notebookText(source)), attachments);
}

function renderOutput(output, options) {
  if (!output || typeof output !== 'object') return '';
  if (output.output_type === 'stream') {
    return `<div class="nb-output nb-stream"><pre>${escapeHtml(stripAnsi(notebookText(output.text)))}</pre></div>`;
  }
  if (output.output_type === 'error') {
    const traceback = Array.isArray(output.traceback) ? output.traceback.join('\n') : notebookText(output.traceback);
    const message = traceback || [output.ename, output.evalue].filter(value => typeof value === 'string').join(': ');
    return `<div class="nb-output nb-error"><pre>${escapeHtml(stripAnsi(message))}</pre></div>`;
  }
  const data = output.data;
  if (!data || typeof data !== 'object') return '';
  const image = rasterDataUrl('image/png', data['image/png']) || rasterDataUrl('image/jpeg', data['image/jpeg']);
  if (image) {
    return `<figure class="nb-output nb-image"><img src="${image}" alt="${escapeHtml(options.imageAlt)}" loading="lazy" decoding="async"></figure>`;
  }
  const html = notebookText(data['text/html']);
  if (html) {
    const sanitized = cleanHtml(html);
    if (sanitized.trim()) return `<div class="nb-output nb-html">${sanitized}</div>`;
  }
  const markdownOutput = notebookText(data['text/markdown']);
  if (markdownOutput) return `<div class="nb-output nb-markdown">${renderMarkdown(markdownOutput)}</div>`;
  if (data['text/plain'] !== undefined) {
    return `<div class="nb-output nb-plain"><pre>${escapeHtml(stripAnsi(notebookText(data['text/plain'])))}</pre></div>`;
  }
  return '';
}

/**
 * Render a saved Jupyter notebook as safe, static HTML without executing code or
 * fetching resources. Outputs reflect only the results already stored in the file.
 * Labels can be localized with codeLabel, outputLabel, rawLabel and imageAlt.
 */
export function renderNotebook(notebook, options = {}) {
  if (!notebook || !Array.isArray(notebook.cells)) throw new TypeError('A notebook with a cells array is required.');
  const labels = {
    codeLabel: 'Code', outputLabel: 'Output', rawLabel: 'Raw cell', imageAlt: 'Saved notebook chart',
    ...options
  };
  const requestedLanguage = options.language || notebook.metadata?.language_info?.name || 'python';
  const language = /^[A-Za-z0-9_-]{1,64}$/.test(requestedLanguage) ? requestedLanguage : 'text';
  return notebook.cells.map(cell => {
    if (!cell || typeof cell !== 'object') return '';
    if (cell.cell_type === 'markdown') {
      return `<section class="nb-cell nb-markdown">${renderMarkdown(cell.source, cell.attachments)}</section>`;
    }
    if (cell.cell_type === 'raw') {
      return `<section class="nb-cell nb-raw"><div class="nb-code-label">${escapeHtml(labels.rawLabel)}</div><pre class="nb-code">${escapeHtml(notebookText(cell.source))}</pre></section>`;
    }
    if (cell.cell_type !== 'code') return '';
    const count = Number.isInteger(cell.execution_count) && cell.execution_count >= 0 ? ` [${cell.execution_count}]` : '';
    const outputs = Array.isArray(cell.outputs) ? cell.outputs.map(output => renderOutput(output, labels)).join('') : '';
    return `<section class="nb-cell nb-code-cell"><div class="nb-code-label">${escapeHtml(labels.codeLabel)}${count}</div><pre class="nb-code"><code class="language-${language}">${escapeHtml(notebookText(cell.source))}</code></pre>${outputs ? `<div class="nb-output-label">${escapeHtml(labels.outputLabel)}</div>${outputs}` : ''}</section>`;
  }).join('\n');
}
