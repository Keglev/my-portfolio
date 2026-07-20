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
const TMPL_DIR    = path.join(__dirname, 'templates');

// Template parts — assembled at runtime into full page and hub HTML
const HEADER_TMPL = path.join(TMPL_DIR, 'header.html');
const FOOTER_TMPL = path.join(TMPL_DIR, 'footer.html');
const PAGE_TMPL   = path.join(TMPL_DIR, 'page.html');
const HUB_TMPL    = path.join(TMPL_DIR, 'hub.html');

// CSS source files in cascade order; concatenated into one output stylesheet
const CSS_PARTS   = ['base.css', 'layout.css', 'components.css', 'typography.css', 'utilities.css']
                      .map(f => path.join(TMPL_DIR, f));
const STYLES_OUT  = path.join(DOCS_DIR, 'templates', 'styles.css');

function run() {
  // Verify all template parts exist before starting
  for (const tmpl of [HEADER_TMPL, FOOTER_TMPL, PAGE_TMPL, HUB_TMPL]) {
    if (!fs.existsSync(tmpl)) {
      console.error(`[build_docs] Template not found: ${tmpl}`);
      process.exit(1);
    }
  }

  const headerTmpl   = fs.readFileSync(HEADER_TMPL, 'utf8');
  const footerTmpl   = fs.readFileSync(FOOTER_TMPL, 'utf8');
  const pageBodyTmpl = fs.readFileSync(PAGE_TMPL,   'utf8');
  const hubBodyTmpl  = fs.readFileSync(HUB_TMPL,    'utf8');

  // Assemble the full doc-page template from its three parts
  const pageTemplate = headerTmpl + '\n' + pageBodyTmpl + '\n' + footerTmpl;
  processDir(DOCS_DIR, 0, pageTemplate, DOCS_DIR);

  // Concatenate split CSS source files into a single output stylesheet
  const stylesDir = path.dirname(STYLES_OUT);
  if (!fs.existsSync(stylesDir)) fs.mkdirSync(stylesDir, { recursive: true });
  const combinedCss = CSS_PARTS.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  fs.writeFileSync(STYLES_OUT, combinedCss, 'utf8');
  console.log('[build_docs]  styles/{base,layout,components,typography,utilities}.css → docs/templates/styles.css');

  // Assemble the hub landing page and write it directly to docs/index.html
  const hubHtml = headerTmpl.replace('{{TITLE}}', 'my-portfolio — Documentation')
                + '\n' + hubBodyTmpl
                + '\n' + footerTmpl;
  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), hubHtml, 'utf8');
  console.log('[build_docs]  hub assembled → index.html');

  console.log('[build_docs] Done.');
}

run();
