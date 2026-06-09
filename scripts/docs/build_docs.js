#!/usr/bin/env node
/**
 * build_docs.js — converts docs/*.md to docs/*.html
 *
 * For each .md file at the docs root:
 *   - Parses markdown with marked
 *   - Wraps ```mermaid fences in .mermaid-wrapper divs for client-side rendering
 *   - Builds a sidebar TOC from h2/h3 headings
 *   - Injects TITLE, TOC, CONTENT into docs/templates/page.html
 *   - Writes docs/<name>.html next to the source .md file
 *
 * Additionally copies docs/templates/hub.html → docs/index.html
 * as the visual landing page, replacing the old static index.html.
 *
 * Usage (from repo root):
 *   node scripts/docs/build_docs.js
 *
 * Dependencies (install once at repo root):
 *   npm install --save-dev marked
 */

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Bootstrap marked
// ---------------------------------------------------------------------------

let markedModule;
try {
  markedModule = require('marked');
} catch {
  console.error(
    '[build_docs] marked is not installed.\n' +
    'Run: npm install --save-dev marked'
  );
  process.exit(1);
}

// Support marked v4–v14 (named export or module-level function)
const markedFn =
  typeof markedModule.marked === 'function'  ? markedModule.marked :
  typeof markedModule        === 'function'  ? markedModule        :
  typeof markedModule.parse  === 'function'  ? markedModule.parse  : null;

if (!markedFn) {
  console.error('[build_docs] Could not resolve a parse function from marked.');
  process.exit(1);
}

const RendererCtor =
  markedModule.Renderer ||
  (markedModule.marked && markedModule.marked.Renderer);

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCS_DIR  = path.join(REPO_ROOT, 'docs');
const TMPL_DIR  = path.join(DOCS_DIR, 'templates');
const PAGE_TMPL = path.join(TMPL_DIR, 'page.html');
const HUB_TMPL  = path.join(TMPL_DIR, 'hub.html');

// ---------------------------------------------------------------------------
// Configure marked: inject id attributes into headings
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

if (RendererCtor) {
  const renderer = new RendererCtor();

  // marked v5+ passes a token object; older versions pass (text, depth, ...)
  renderer.heading = function (tokenOrText, maybeDepth) {
    const text  = typeof tokenOrText === 'object' ? tokenOrText.text  : tokenOrText;
    const depth = typeof tokenOrText === 'object' ? tokenOrText.depth : maybeDepth;
    const id    = slugify(text.replace(/<[^>]+>/g, ''));
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  const setOptions = markedFn.setOptions || (markedModule.marked && markedModule.marked.setOptions);
  if (setOptions) setOptions.call(markedFn, { renderer });
}

// ---------------------------------------------------------------------------
// HTML post-processors
// ---------------------------------------------------------------------------

/**
 * Convert <pre><code class="language-mermaid">…</code></pre>
 * into <div class="mermaid-wrapper"><pre class="mermaid">…</pre></div>
 * so that mermaid.js picks them up for client-side rendering.
 */
function wrapMermaid(html) {
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) =>
      `<div class="mermaid-wrapper"><pre class="mermaid">${code}</pre></div>`
  );
}

/**
 * Rewrite href="some-file.md" → href="some-file.html" (with optional #anchor)
 * so internal cross-links work after .md → .html conversion.
 */
function rewriteLinks(html) {
  return html.replace(
    /href="([^"#]+)\.md(#[^"]*)?">/g,
    (_, file, hash) => `href="${file}.html${hash || ''}">`
  );
}

// ---------------------------------------------------------------------------
// TOC builder
// ---------------------------------------------------------------------------

/**
 * Scan rendered HTML for h2/h3 tags with ids, return a <ul> nav list.
 * Returns empty string when fewer than 2 headings are found.
 */
function buildToc(html) {
  const re    = /<h([23])\s[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  const items = [];
  let m;

  while ((m = re.exec(html)) !== null) {
    items.push({ level: parseInt(m[1], 10), id: m[2], text: m[3].replace(/<[^>]+>/g, '') });
  }

  if (items.length < 2) return '';

  const lines = ['<ul class="doc-toc__list">'];
  items.forEach(({ level, id, text }) => {
    lines.push(`  <li${level === 3 ? ' class="toc-h3"' : ''}><a href="#${id}">${text}</a></li>`);
  });
  lines.push('</ul>');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Core conversion
// ---------------------------------------------------------------------------

function convertMd(mdPath, template) {
  const src  = fs.readFileSync(mdPath, 'utf8');
  const h1   = src.match(/^#\s+(.+)$/m);
  const title = h1 ? h1[1].trim() : path.basename(mdPath, '.md');

  let html = markedFn(src);
  html = wrapMermaid(html);
  html = rewriteLinks(html);

  return template
    .replace('{{TITLE}}',   title)
    .replace('{{TOC}}',     buildToc(html))
    .replace('{{CONTENT}}', html);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function run() {
  if (!fs.existsSync(PAGE_TMPL)) {
    console.error(`[build_docs] Template not found: ${PAGE_TMPL}`);
    process.exit(1);
  }

  const template = fs.readFileSync(PAGE_TMPL, 'utf8');
  const mdFiles  = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));

  if (!mdFiles.length) {
    console.warn('[build_docs] No .md files found in', DOCS_DIR);
  }

  for (const file of mdFiles) {
    const src = path.join(DOCS_DIR, file);
    const out = path.join(DOCS_DIR, path.basename(file, '.md') + '.html');
    try {
      fs.writeFileSync(out, convertMd(src, template), 'utf8');
      console.log(`[build_docs]  ${file} → ${path.basename(out)}`);
    } catch (err) {
      console.error(`[build_docs]  FAIL ${file}: ${err.message}`);
    }
  }

  // Replace the old static index.html with the visual hub page
  if (fs.existsSync(HUB_TMPL)) {
    fs.copyFileSync(HUB_TMPL, path.join(DOCS_DIR, 'index.html'));
    console.log('[build_docs]  hub.html → index.html');
  }

  console.log('[build_docs] Done.');
}

run();
