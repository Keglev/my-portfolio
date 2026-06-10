#!/usr/bin/env node
/**
 * postprocessProjects.js
 *
 * Runs a sequence of post-processing passes on public/projects.json after
 * fetchProjects.js has populated it. Passes execute in order:
 *   1. probeGithubIoLinks  — prefers GitHub Pages URLs over raw.githubusercontent.com
 *   2. backfillLegacyDocs  — populates docsLink from repoDocs when missing
 *   3. fixBadDocsTitles    — replaces placeholder or invalid doc titles
 *   4. normalizeTechTokens — splits and cleans compound technology strings
 *
 * Called by the build-and-fetch.yml workflow after fetchProjects.js and
 * applyFallbackDocScan.js have run. Writes the result back to projects.json.
 */
const fs = require('fs');
const path = require('path');

const { getAxios } = require('./lib/axiosLoader');

const FILE = path.join(__dirname, '..', 'public', 'projects.json');
const DEBUG = process.env.DEBUG_FETCH === '1' || false;

/**
 * Probes whether a raw.githubusercontent.com docs URL has a rendered GitHub Pages equivalent.
 * Rejects candidates whose X-Frame-Options header is DENY, since those won't embed in the site.
 *
 * @param {object} node - Repository node (used only for debug logging)
 * @param {string} href - raw.githubusercontent.com URL to probe
 * @returns {Promise<string|null>} GitHub Pages URL when reachable and embeddable, otherwise null
 */
async function tryGithubIo(node, href) {
  try {
    if (!href) return null;
    const re = new RegExp('https?:\\/\\/raw\\.githubusercontent\\.com\\/(?:[^\\/]+)\\/(?:[^\\/]+)\\/(?:main|master)\\/docs\\/(.+)$', 'i');
    const m = href.match(re);
    if (!m || !m[1]) return null;
    const afterDocs = m[1].replace(/index\.html$/i, '').replace(/(^\/|\/$)/g, '');
    const candidates = [`https://keglev.github.io/${node.name}/${afterDocs}`, `https://keglev.github.io/${node.name}/${afterDocs}/index.html`];
    if (!afterDocs) candidates.unshift(`https://keglev.github.io/${node.name}/`);
    for (const c of candidates) {
      try {
        const ax = getAxios(); if (!ax) continue;
        const h = await ax.head(c, { maxRedirects: 5, timeout: 5000 });
        const ct = (h && h.headers && h.headers['content-type']) || '';
        const xfo = (h && h.headers && (h.headers['x-frame-options'] || h.headers['X-Frame-Options'])) || '';
        if (h && h.status === 200 && /html/i.test(ct) && !/deny/i.test(xfo)) {
          if (DEBUG) console.log('Prefer github.io for', node.name, href, '->', c);
          return c;
        }
      } catch (e) { if (DEBUG) console.log('candidate failed', c, e && e.message); }
    }
  } catch (e) { if (DEBUG) console.log('tryGithubIo err', e && e.message); }
  return null;
}

/**
 * Splits a compound technology string and strips surrounding punctuation from each token.
 * Handles entries like "Spring Boot and React" or "Java, Kotlin" as separate technologies.
 *
 * @param {string} token - Raw technology string from a README
 * @returns {string[]|null} Cleaned token array, or null if nothing usable remains
 */
function normalizeTech(token) {
  if (!token) return null;
  let t = String(token).trim().replace(/\*\*/g, '').replace(/\s+for\b[\s\S]*$/i, '').trim();
  const p = t.indexOf('(');
  if (p !== -1) t = t.slice(0, p).trim();
  // split "Spring Boot and React", "Java / Kotlin", "A + B", "A & B", "A, B"
  const parts = String(t).split(/\s*(?:,|\bwith\b|\band\b|\s+\/\s+|\s+&\s+|\s+\+\s+)\s*/i).map(s => s && s.trim()).filter(Boolean);
  const strip = new Set(['-', ':', '(', ')', '[', ']', '"', "'", ',', '.', ';']);
  const cleaned = parts.map(part => {
    let q = String(part || '').trim();
    while (q.length && (q[0].trim() === '' || strip.has(q[0]))) q = q.slice(1);
    while (q.length && (q[q.length - 1].trim() === '' || strip.has(q[q.length - 1]))) q = q.slice(0, -1);
    return q.trim();
  }).filter(Boolean);
  return cleaned.length ? cleaned : null;
}

async function probeGithubIoLinks(nodes) {
  for (const node of nodes) {
    try {
      // Only probe raw GitHub URLs; already-preferred github.io links are skipped
      if (node.docsLink && /raw\.githubusercontent\.com/i.test(node.docsLink)) {
        const p = await tryGithubIo(node, node.docsLink); if (p) node.docsLink = p;
      }
      if (node.repoDocs) {
        const rd = node.repoDocs;
        if (rd.apiDocumentation && rd.apiDocumentation.link && /raw\.githubusercontent\.com/i.test(rd.apiDocumentation.link)) {
          const p = await tryGithubIo(node, rd.apiDocumentation.link); if (p) rd.apiDocumentation.link = p;
        }
        if (rd.architectureOverview && rd.architectureOverview.link && /raw\.githubusercontent\.com/i.test(rd.architectureOverview.link)) {
          const p = await tryGithubIo(node, rd.architectureOverview.link); if (p) rd.architectureOverview.link = p;
        }
        if (rd.testing && rd.testing.testingDocs && rd.testing.testingDocs.link && /raw\.githubusercontent\.com/i.test(rd.testing.testingDocs.link)) {
          const p = await tryGithubIo(node, rd.testing.testingDocs.link); if (p) rd.testing.testingDocs.link = p;
        }
      }
    } catch (e) { if (DEBUG) console.log('probeGithubIoLinks failed for', node.name, e && e.message); }
  }
}

function backfillLegacyDocs(nodes) {
  for (const node of nodes) {
    try {
      if ((!node.docsLink || node.docsLink === null) && node.repoDocs) {
        if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link) {
          node.docsLink = node.repoDocs.apiDocumentation.link;
          node.docsTitle = node.docsTitle || (node.repoDocs.apiDocumentation.title || 'API Documentation');
        } else if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link) {
          node.docsLink = node.repoDocs.architectureOverview.link;
          node.docsTitle = node.docsTitle || (node.repoDocs.architectureOverview.title || 'Documentation');
        }
      }
    } catch (e) { if (DEBUG) console.log('backfillLegacyDocs failed for', node.name, e && e.message); }
  }
}

function fixBadDocsTitles(nodes) {
  const isBadTitle = t => !t || /open an issue/i.test(String(t).trim());
  const tryTitle = p => (p && p.title && !isBadTitle(p.title)) ? p.title : null;
  for (const node of nodes) {
    try {
      if (!isBadTitle(node.docsTitle)) continue;
      const found = [
        tryTitle(node.repoDocs && node.repoDocs.apiDocumentation),
        tryTitle(node.repoDocs && node.repoDocs.documentation),
        tryTitle(node.docs && node.docs.apiDocumentation),
        tryTitle(node.docs && node.docs.documentation),
      ].find(x => x);
      node.docsTitle = found || (node.docsLink ? 'Documentation' : node.docsTitle || null);
    } catch (e) { if (DEBUG) console.log('fixBadDocsTitles failed for', node.name, e && e.message); }
  }
}

function normalizeTechTokens(nodes) {
  for (const node of nodes) {
    try {
      if (!Array.isArray(node.technologies)) continue;
      const seen = new Set();
      const out = [];
      for (const t of node.technologies) {
        const n = normalizeTech(t);
        if (!n) continue;
        for (const p of (Array.isArray(n) ? n : [n])) {
          if (p && !seen.has(p)) { seen.add(p); out.push(p); }
        }
      }
      node.technologies = out;
    } catch (e) { if (DEBUG) console.log('normalizeTechTokens failed for', node.name, e && e.message); }
  }
}

/**
 * Runs all post-processing passes on the projects array and writes the result to projects.json.
 * Passes execute in order: GitHub Pages probing → legacy docs backfill → bad-title fix → tech normalization.
 *
 * @param {object[]} nodes - Enriched project objects loaded from projects.json
 * @returns {Promise<void>}
 */
async function main(nodes) {
  await probeGithubIoLinks(nodes);
  backfillLegacyDocs(nodes);
  fixBadDocsTitles(nodes);
  normalizeTechTokens(nodes);
  fs.writeFileSync(FILE, JSON.stringify(nodes, null, 2), 'utf8');
  console.log('Wrote', FILE);
}

module.exports = { tryGithubIo, normalizeTech, main };

if (require.main === module) {
  if (!fs.existsSync(FILE)) { console.error('projects.json not found at', FILE); process.exit(1); }
  const nodes = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  main(nodes).catch(e => { console.error(e); process.exit(1); });
}
