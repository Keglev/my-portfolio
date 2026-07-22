#!/usr/bin/env node
/**
 * @file build_mermaid.js
 * @module scripts/docs/build_mermaid
 * @summary Pre-renders Mermaid diagrams in HTML docs to inline SVG.
 * @enterprise WAIVER 2026-07: this file is 210 lines, over the docs-build
 * script alarm (200), on line count alone. Its functions form a single
 * cohesive pipeline (find mmdc -> collect HTML files -> extract mermaid
 * blocks -> render each -> write back) with no separable responsibility
 * the way build_docs.js had -- every function exists only to serve this
 * one pipeline, so splitting it would scatter one concern across multiple
 * files rather than separate genuinely different concerns. Kept as one
 * file; revisit only if a second, unrelated responsibility is added.
 *
 * Scans every .html file under docs/ for elements that look like:
 *
 *   <div class="mermaid-wrapper">
 *     <pre class="mermaid">flowchart LR ...</pre>
 *   </div>
 *
 * If @mermaid-js/mermaid-cli (mmdc) is available on PATH, each diagram
 * is rendered to an inline SVG and the <pre> block is replaced in-place.
 * Pre-rendering improves first-paint speed and removes the CDN dependency.
 *
 * When mmdc is not found the script exits cleanly with an informational
 * message -- the page.html template already includes the Mermaid CDN
 * script, so diagrams still render in the browser without pre-rendering.
 *
 * Usage (from repo root):
 *   node scripts/docs/build_mermaid.js
 *   node scripts/docs/build_mermaid.js --dry-run   # report only, no writes
 *
 * Install mmdc globally (optional):
 *   npm install -g @mermaid-js/mermaid-cli
 *
 * Or as a local devDependency:
 *   npm install --save-dev @mermaid-js/mermaid-cli
 *   npx node scripts/docs/build_mermaid.js
 */

const fs            = require('fs');
const path          = require('path');
const os            = require('os');
const { execSync }  = require('child_process');

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCS_DIR  = path.join(REPO_ROOT, 'docs');

// ---------------------------------------------------------------------------
// Detect mmdc
// ---------------------------------------------------------------------------

function findMmdc() {
  // 1. Local devDependency (node_modules/.bin/mmdc)
  const localBin = path.join(REPO_ROOT, 'node_modules', '.bin', 'mmdc');
  if (fs.existsSync(localBin)) return localBin;

  // 2. Global install on PATH
  try {
    const which = process.platform === 'win32' ? 'where mmdc' : 'which mmdc';
    const result = execSync(which, { stdio: 'pipe' }).toString().trim().split('\n')[0];
    if (result) return result;
  } catch {
    // not on PATH
  }

  return null;
}

// ---------------------------------------------------------------------------
// Extract mermaid blocks from an HTML file
// ---------------------------------------------------------------------------

/**
 * Returns an array of { index, fullMatch, code } objects.
 * index    -- character offset of the match in `html`
 * fullMatch -- the complete wrapper div string
 * code     -- the raw Mermaid diagram source
 */
function extractBlocks(html) {
  const re =
    /<div class="mermaid-wrapper">\s*<pre class="mermaid">([\s\S]*?)<\/pre>\s*<\/div>/g;
  const blocks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push({ index: m.index, fullMatch: m[0], code: m[1].trim() });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Render one diagram via mmdc -> inline SVG
// ---------------------------------------------------------------------------

function renderDiagram(mmdc, code) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-'));
  const inFile = path.join(tmpDir, 'diagram.mmd');
  const outFile = path.join(tmpDir, 'diagram.svg');

  try {
    fs.writeFileSync(inFile, code, 'utf8');
    execSync(`"${mmdc}" -i "${inFile}" -o "${outFile}" --quiet`, { stdio: 'pipe' });
    const svg = fs.readFileSync(outFile, 'utf8');
    // Strip XML declaration and DOCTYPE if present
    return svg
      .replace(/^<\?xml[^?]*\?>\s*/i, '')
      .replace(/^<!DOCTYPE[^>]*>\s*/i, '')
      .trim();
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Process one HTML file
// ---------------------------------------------------------------------------

function processFile(htmlPath, mmdc) {
  let html   = fs.readFileSync(htmlPath, 'utf8');
  const blocks = extractBlocks(html);

  if (!blocks.length) return 0;

  let replaced = 0;
  // Replace in reverse order so character offsets stay valid
  for (const block of blocks.slice().reverse()) {
    try {
      const svg = renderDiagram(mmdc, block.code);
      const wrapper = `<div class="mermaid-wrapper">\n${svg}\n</div>`;
      html = html.slice(0, block.index) + wrapper + html.slice(block.index + block.fullMatch.length);
      replaced++;
    } catch (err) {
      console.warn(`[build_mermaid]   Could not render diagram: ${err.message}`);
    }
  }

  if (replaced > 0 && !DRY_RUN) {
    fs.writeFileSync(htmlPath, html, 'utf8');
  }

  return replaced;
}

// ---------------------------------------------------------------------------
// Collect HTML files
// ---------------------------------------------------------------------------

function collectHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // Skip jsdoc/coverage (generated by other tools) and _theme (chrome, no mermaid content)
      if (entry.name === 'jsdoc' || entry.name === 'coverage' || entry.name === '_theme') continue;
      results.push(...collectHtmlFiles(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.html')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function run() {
  if (DRY_RUN) console.log('[build_mermaid] --dry-run: no files will be written.');

  const mmdc = findMmdc();

  if (!mmdc) {
    console.log(
      '[build_mermaid] mmdc not found -- skipping pre-render.\n' +
      '  Diagrams will be rendered client-side by the Mermaid CDN script\n' +
      '  included in docs/_theme/templates/page.html (the doc-page body partial).\n' +
      '\n' +
      '  To enable pre-rendering, install mermaid-cli:\n' +
      '    npm install --save-dev @mermaid-js/mermaid-cli'
    );
    return;
  }

  console.log(`[build_mermaid] Using mmdc: ${mmdc}`);

  const files = collectHtmlFiles(DOCS_DIR);
  let totalDiagrams = 0;
  let totalFiles    = 0;

  for (const file of files) {
    const count = processFile(file, mmdc);
    if (count > 0) {
      const rel = path.relative(DOCS_DIR, file);
      const tag = DRY_RUN ? '(dry-run)' : '[ok]';
      console.log(`[build_mermaid]  ${tag} ${rel}: ${count} diagram${count > 1 ? 's' : ''} pre-rendered`);
      totalDiagrams += count;
      totalFiles++;
    }
  }

  if (totalDiagrams === 0) {
    console.log('[build_mermaid] No mermaid diagrams found in HTML files.');
  } else {
    console.log(
      `[build_mermaid] Done -- ${totalDiagrams} diagram${totalDiagrams > 1 ? 's' : ''} ` +
      `in ${totalFiles} file${totalFiles > 1 ? 's' : ''}.`
    );
  }
}

// CLI guard: running the file executes the pipeline, importing it does not.
// Same pattern as scripts/ci/detectPipelineScope.js, and for the same reason
// -- the behaviour below (mmdc discovery, block extraction, the clean exit
// when mmdc is absent) is load-bearing in CI and can only be unit tested if
// importing the module has no side effects.
if (require.main === module) {
  run();
}

module.exports = {
  findMmdc,
  extractBlocks,
  processFile,
  collectHtmlFiles,
  run,
};
