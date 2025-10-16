#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const FILE = path.join(__dirname, '..', 'public', 'projects.json');
if (!fs.existsSync(FILE)) {
  console.error('projects.json not found at', FILE);
  process.exit(1);
}
let nodes = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const DEBUG = process.env.DEBUG_FETCH === '1' || false;

const tryGithubIo = async (node, href) => {
  try {
    if (!href) return null;
    const re = new RegExp('https?:\\/\\/raw\\.githubusercontent\\.com\\/(?:[^\\/]+)\\/(?:[^\\/]+)\\/(?:main|master)\\/docs\\/(.+)$', 'i');
    const m = href.match(re);
    if (!m || !m[1]) return null;
    const afterDocs = m[1].replace(/index\.html$/i, '').replace(/(^\/|\/$)/g, '');
    const candidates = [];
    candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}`);
    candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}/index.html`);
    if (!afterDocs) candidates.unshift(`https://keglev.github.io/${node.name}/`);
    for (const c of candidates) {
      try {
        const h = await axios.head(c, { maxRedirects: 5, timeout: 5000 });
        const ct = (h && h.headers && h.headers['content-type']) || '';
        const xfo = (h && h.headers && (h.headers['x-frame-options'] || h.headers['X-Frame-Options'])) || '';
        if (h && h.status === 200 && /html/i.test(ct) && !/deny/i.test(xfo)) {
          if (DEBUG) console.log('Prefer github.io for', node.name, href, '->', c);
          return c;
        }
      } catch (e) {
        if (DEBUG) console.log('candidate failed', c, e && e.message);
      }
    }
  } catch (e) { if (DEBUG) console.log('tryGithubIo err', e && e.message); }
  return null;
};

(async function main(){
  for (const node of nodes) {
    try {
      if (node.docsLink && /raw\.githubusercontent\.com/i.test(node.docsLink)) {
        const p = await tryGithubIo(node, node.docsLink);
        if (p) node.docsLink = p;
      }
      if (node.repoDocs) {
        if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.apiDocumentation.link)) {
          const p = await tryGithubIo(node, node.repoDocs.apiDocumentation.link);
          if (p) node.repoDocs.apiDocumentation.link = p;
        }
        if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.architectureOverview.link)) {
          const p = await tryGithubIo(node, node.repoDocs.architectureOverview.link);
          if (p) node.repoDocs.architectureOverview.link = p;
        }
        if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && node.repoDocs.testing.testingDocs.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.testing.testingDocs.link)) {
          const p = await tryGithubIo(node, node.repoDocs.testing.testingDocs.link);
          if (p) node.repoDocs.testing.testingDocs.link = p;
        }
      }
    } catch (e) { if (DEBUG) console.log('postproc failed', node.name, e && e.message); }
  }
  // Backfill legacy docsLink/docsTitle from repoDocs when missing
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
    } catch (e) { if (DEBUG) console.log('backfill postprocess failed', node.name, e && e.message); }
  }

  // Ensure docsTitle is sensible and not the generic "open an issue" text
  const isBadTitle = t => !t || /open an issue/i.test(String(t).trim());
  for (const node of nodes) {
    try {
      if (isBadTitle(node.docsTitle)) {
        // prefer apiDocumentation title, then documentation, then a safe default
        const tryTitle = (p) => (p && p.title && !isBadTitle(p.title)) ? p.title : null;
        const candidates = [
          tryTitle(node && node.repoDocs && node.repoDocs.apiDocumentation),
          tryTitle(node && node.repoDocs && node.repoDocs.documentation),
          tryTitle(node && node.docs && node.docs.apiDocumentation),
          tryTitle(node && node.docs && node.docs.documentation),
        ];
        const found = candidates.find(x => x);
        node.docsTitle = found || (node.docsLink ? 'Documentation' : node.docsTitle || null);
      }
    } catch (e) { if (DEBUG) console.log('docsTitle fix failed', node.name, e && e.message); }
  }
  fs.writeFileSync(FILE, JSON.stringify(nodes, null, 2), 'utf8');
  console.log('Wrote', FILE);
})();
