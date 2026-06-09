#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'public', 'projects.json');

/**
 * Regex-scans README text for doc-like markdown links and attaches the first match
 * as repoDocs.apiDocumentation. Only runs on nodes that have no repoDocs yet, so
 * structured extraction results are never overwritten.
 *
 * @param {object[]} nodes - Project nodes from projects.json
 * @param {Function} normalizeTitle - Title sanitizer from fetchProjects
 * @returns {object[]} The same nodes array, mutated in place
 */
function scanNodes(nodes, normalizeTitle) {
  for (const node of nodes) {
    if (node.repoDocs) continue;
    try {
      const txt = (node.object && node.object.text) || '';
      const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.\/[^)\s]+|\/[^)\s]+|[^)]+\.md)\)/ig;
      let m;
      while ((m = linkRe.exec(txt)) !== null) {
        const label = (m[1] || '').trim();
        let href = (m[2] || '').trim();
        if (/localhost|127\.0\.0\.1|docker/i.test(href)) continue;
        if (/docs?|api|redoc|openapi|swagger|reDoc|documentation|api docs/i.test(label + ' ' + href)) {
          if (!/^https?:\/\//i.test(href)) href = href.replace(/^\.?\//,'').replace(/^\//,'');
          const absolute = /^https?:\/\//i.test(href)
            ? href
            : `https://raw.githubusercontent.com/keglev/${node.name}/main/${href}`;
          node.repoDocs = node.repoDocs || {};
          node.repoDocs.apiDocumentation = node.repoDocs.apiDocumentation || {
            title: label || 'API Documentation',
            link: absolute,
            description: '',
          };
          node.docsLink = node.docsLink || absolute;
          node.docsTitle = node.docsTitle || normalizeTitle(label) || 'Documentation';
          break;
        }
      }
    } catch (e) { /* ignore */ }
  }
  return nodes;
}

module.exports = { scanNodes, FILE };

if (require.main === module) {
  if (!fs.existsSync(FILE)) {
    console.error('public/projects.json not found');
    process.exit(1);
  }
  const normalizeTitle = require('./fetchProjects.js').normalizeTitle;
  const nodes = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  scanNodes(nodes, normalizeTitle);
  fs.writeFileSync(FILE, JSON.stringify(nodes, null, 2), 'utf8');
  console.log('Applied fallback doc-scan and wrote', FILE);
}
