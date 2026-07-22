#!/usr/bin/env node
/**
 * @file build_docs.js
 * @module scripts/docs/build_docs
 * @summary Converts docs/**\/*.md to docs/**\/*.html and assembles the
 * docs/index.html hub landing page.
 * @enterprise Thin orchestrator: reads the template parts, wires them into
 * lib/renderPages.js's processDir walk, then assembles the CSS bundle and
 * hub page itself (both single-shot, not recursive, so they stayed here
 * rather than moving to a lib module). The actual markdown-to-HTML
 * machinery -- marked bootstrap/config, HTML post-processing, TOC
 * building, and the recursive directory walk -- lives in scripts/docs/lib/
 * (markedConfig, htmlPostprocess, tocBuilder, renderPages), split out
 * because each was a genuinely separate concern with its own change
 * reasons, not merely to reduce this file's line count.
 *
 * Usage (from repo root):
 *   node scripts/docs/build_docs.js
 *
 * Dependencies (install once at repo root):
 *   npm install --save-dev marked
 */
const fs   = require('fs');
const path = require('path');
const { processDir } = require('./lib/renderPages');

const REPO_ROOT   = path.resolve(__dirname, '..', '..');
const DOCS_DIR    = path.join(REPO_ROOT, 'docs');
const THEME_DIR   = path.join(DOCS_DIR, '_theme');
const TMPL_DIR    = path.join(THEME_DIR, 'templates');
const CSS_DIR     = path.join(THEME_DIR, 'css');

// CSS source files in cascade order; concatenated into one output stylesheet.
// Order is load-bearing: tokens first, landing last so it can override shared
// component rules. mermaid.css from the reference theme is deliberately not
// ported — page.html keeps an explicit dark themeVariables Mermaid init
// instead (see page.html).
// Names, not absolute paths: run() resolves them against its cssDir so the
// same list works for the real docs/ tree and for a test's temporary one.
const CSS_PART_NAMES = [
  'tokens.css', 'base.css', 'layout.css', 'components.css', 'content.css', 'landing.css',
];

/**
 * Concatenates the split CSS sources into one stylesheet, in cascade order.
 * Order is load-bearing: tokens must precede everything that references them,
 * and landing.css last so it can override shared component rules.
 *
 * @param {string[]} parts - Absolute paths, already in cascade order
 * @param {(filePath: string) => string} [read] - Injected reader, for tests
 * @returns {string}
 */
function concatCss(parts, read = (filePath) => fs.readFileSync(filePath, 'utf8')) {
  return parts.map(read).join('\n');
}

/**
 * Assembles a landing page from the shared header/footer and a language
 * specific body, substituting the page title into the header.
 *
 * @param {string} headerTmpl
 * @param {string} bodyTmpl
 * @param {string} footerTmpl
 * @param {string} title
 * @returns {string}
 */
function assembleLanding(headerTmpl, bodyTmpl, footerTmpl, title) {
  return headerTmpl.replace('{{TITLE}}', title) + '\n' + bodyTmpl + '\n' + footerTmpl;
}

/**
 * Builds the documentation site.
 *
 * @param {object} [dirs] - Directory overrides. Defaults are the repo's real
 *   docs/ tree, which is what the CLI uses. Tests pass a temporary tree
 *   instead: without this seam the only way to exercise run() would be to
 *   rewrite every tracked file under docs/ as a test side effect.
 * @param {string} [dirs.docsDir]
 * @param {string} [dirs.tmplDir]
 * @param {string} [dirs.cssDir]
 */
function run({ docsDir = DOCS_DIR, tmplDir = TMPL_DIR, cssDir = CSS_DIR } = {}) {
  const headerPath    = path.join(tmplDir, 'header.html');
  const footerPath    = path.join(tmplDir, 'footer.html');
  const pagePath      = path.join(tmplDir, 'page.html');
  const landingEnPath = path.join(tmplDir, 'landing-en.html');
  const landingDePath = path.join(tmplDir, 'landing-de.html');
  const stylesOut     = path.join(cssDir, 'styles.css');
  const cssParts      = CSS_PART_NAMES.map((f) => path.join(cssDir, f));

  // Verify all template parts exist before starting
  for (const tmpl of [headerPath, footerPath, pagePath, landingEnPath, landingDePath]) {
    if (!fs.existsSync(tmpl)) {
      console.error(`[build_docs] Template not found: ${tmpl}`);
      process.exit(1);
      return;
    }
  }

  const headerTmpl     = fs.readFileSync(headerPath,    'utf8');
  const footerTmpl     = fs.readFileSync(footerPath,    'utf8');
  const pageBodyTmpl   = fs.readFileSync(pagePath,      'utf8');
  const landingEnTmpl  = fs.readFileSync(landingEnPath, 'utf8');
  const landingDeTmpl  = fs.readFileSync(landingDePath, 'utf8');

  // Assemble the full doc-page template from its three parts
  const pageTemplate = headerTmpl + '\n' + pageBodyTmpl + '\n' + footerTmpl;
  processDir(docsDir, 0, pageTemplate, docsDir);

  // Concatenate split CSS source files into a single output stylesheet
  if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir, { recursive: true });
  fs.writeFileSync(stylesOut, concatCss(cssParts), 'utf8');
  console.log('[build_docs]  _theme/css/{tokens,base,layout,components,content,landing}.css → docs/_theme/css/styles.css');

  // Assemble the bilingual landing pages and write them directly to docs/
  const landingEnHtml = assembleLanding(
    headerTmpl, landingEnTmpl, footerTmpl, 'my-portfolio — Documentation'
  );
  fs.writeFileSync(path.join(docsDir, 'index.html'), landingEnHtml, 'utf8');

  const landingDeHtml = assembleLanding(
    headerTmpl, landingDeTmpl, footerTmpl, 'my-portfolio — Dokumentation'
  );
  fs.writeFileSync(path.join(docsDir, 'index-de.html'), landingDeHtml, 'utf8');
  console.log('[build_docs]  landing assembled → index.html, index-de.html');

  console.log('[build_docs] Done.');
}

// CLI guard: running the file builds the docs, importing it does not. Same
// pattern as scripts/ci/detectPipelineScope.js -- without it, merely importing
// this module for a unit test would rewrite every file under docs/.
if (require.main === module) {
  run();
}

module.exports = { run, assembleLanding, concatCss };
