#!/usr/bin/env node
/**
 * scripts/applyFallbackDocScan.js
 * -------------------------------
 * Quick utility that scans `public/projects.json` for inline README links
 * that look like API / documentation references and backfills `node.repoDocs`
 * and legacy `docsLink`/`docsTitle` fields when missing. Intended for
 * occasional local runs to repair incomplete artifacts.
 */
const fs = require('fs');
const path = require('path');
const normalizeTitle = require('./fetchProjects.js').normalizeTitle;

const FILE = path.join(__dirname, '..', 'public', 'projects.json');
// Ensure artifact exists before proceeding (this script operates on generated output)
if (!fs.existsSync(FILE)) { console.error('public/projects.json not found'); process.exit(1); }
const nodes = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// Walk every node and attempt to find likely API/docs links when repoDocs is missing
for (const node of nodes) {
  // Skip nodes that already have structured repoDocs
  if (node.repoDocs) continue;
  try {
    const txt = (node.object && node.object.text) || '';
    // linkRe matches markdown-style links, local .md links, and relative paths
    const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.\/[^)\s]+|\/[^)\s]+|[^)]+\.md)\)/ig;
    let m;
    // Iterate all matches in the README text
    while ((m = linkRe.exec(txt)) !== null) {
      const label = (m[1]||'').trim();
      let href = (m[2]||'').trim();
      // Skip obviously local or unsafe links
      if (/localhost|127\.0\.0\.1|docker|:/i.test(href)) continue;
      // Heuristic: if the label or href looks doc-like, prefer it
      if (/docs?|api|redoc|openapi|swagger|reDoc|documentation|api docs/i.test(label + ' ' + href)) {
        // Normalize relative paths into a raw.githubusercontent absolute path
        if (!/^https?:\/\//i.test(href)) href = href.replace(/^\.?\//,'').replace(/^\//,'');
        const absolute = /^https?:\/\//i.test(href) ? href : `https://raw.githubusercontent.com/keglev/${node.name}/main/${href}`;
        node.repoDocs = node.repoDocs || {};
        node.repoDocs.apiDocumentation = node.repoDocs.apiDocumentation || { title: label || 'API Documentation', link: absolute, description: '' };
        node.docsLink = node.docsLink || absolute;
        node.docsTitle = node.docsTitle || normalizeTitle(label) || 'Documentation';
        // Stop scanning this README once we've found a doc-like match
        break;
      }
    }
  } catch (e) { /* ignore per-node failures to keep scan resilient */ }
}

// Persist the mutated artifact back to disk
fs.writeFileSync(FILE, JSON.stringify(nodes, null, 2), 'utf8');
console.log('Applied fallback doc-scan and wrote', FILE);
