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

// Template parts — assembled at runtime into full page and landing HTML
const HEADER_TMPL      = path.join(TMPL_DIR, 'header.html');
const FOOTER_TMPL      = path.join(TMPL_DIR, 'footer.html');
const PAGE_TMPL        = path.join(TMPL_DIR, 'page.html');
const LANDING_EN_TMPL  = path.join(TMPL_DIR, 'landing-en.html');
const LANDING_DE_TMPL  = path.join(TMPL_DIR, 'landing-de.html');

// CSS source files in cascade order; concatenated into one output stylesheet.
// mermaid.css from the reference theme is deliberately not ported — page.html
// keeps an explicit dark themeVariables Mermaid init instead (see page.html).
const CSS_PARTS   = ['tokens.css', 'base.css', 'layout.css', 'components.css', 'content.css', 'landing.css']
                      .map(f => path.join(CSS_DIR, f));
const STYLES_OUT  = path.join(CSS_DIR, 'styles.css');

function run() {
  // Verify all template parts exist before starting
  for (const tmpl of [HEADER_TMPL, FOOTER_TMPL, PAGE_TMPL, LANDING_EN_TMPL, LANDING_DE_TMPL]) {
    if (!fs.existsSync(tmpl)) {
      console.error(`[build_docs] Template not found: ${tmpl}`);
      process.exit(1);
    }
  }

  const headerTmpl     = fs.readFileSync(HEADER_TMPL,     'utf8');
  const footerTmpl     = fs.readFileSync(FOOTER_TMPL,     'utf8');
  const pageBodyTmpl   = fs.readFileSync(PAGE_TMPL,       'utf8');
  const landingEnTmpl  = fs.readFileSync(LANDING_EN_TMPL, 'utf8');
  const landingDeTmpl  = fs.readFileSync(LANDING_DE_TMPL, 'utf8');

  // Assemble the full doc-page template from its three parts
  const pageTemplate = headerTmpl + '\n' + pageBodyTmpl + '\n' + footerTmpl;
  processDir(DOCS_DIR, 0, pageTemplate, DOCS_DIR);

  // Concatenate split CSS source files into a single output stylesheet
  if (!fs.existsSync(CSS_DIR)) fs.mkdirSync(CSS_DIR, { recursive: true });
  const combinedCss = CSS_PARTS.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  fs.writeFileSync(STYLES_OUT, combinedCss, 'utf8');
  console.log('[build_docs]  _theme/css/{tokens,base,layout,components,content,landing}.css → docs/_theme/css/styles.css');

  // Assemble the bilingual landing pages and write them directly to docs/
  const landingEnHtml = headerTmpl.replace('{{TITLE}}', 'my-portfolio — Documentation')
                       + '\n' + landingEnTmpl
                       + '\n' + footerTmpl;
  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), landingEnHtml, 'utf8');

  const landingDeHtml = headerTmpl.replace('{{TITLE}}', 'my-portfolio — Dokumentation')
                       + '\n' + landingDeTmpl
                       + '\n' + footerTmpl;
  fs.writeFileSync(path.join(DOCS_DIR, 'index-de.html'), landingDeHtml, 'utf8');
  console.log('[build_docs]  landing assembled → index.html, index-de.html');

  console.log('[build_docs] Done.');
}

run();
