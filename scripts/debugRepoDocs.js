#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'public', 'projects.json');
if (!fs.existsSync(FILE)) { console.error('public/projects.json not found'); process.exit(1); }
const nodes = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const names = process.argv.slice(2).length ? process.argv.slice(2) : nodes.map(n=>n.name);

function findLinksInText(text) {
  if (!text) return [];
  const out = [];
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.\/[^)\s]+|\/[^)\s]+|[^)]+\.md)\)/ig;
  let m;
  while ((m = linkRe.exec(text)) !== null) {
    out.push({ label: m[1], href: m[2] });
  }
  // also find plain URLs
  const urlRe = /(https?:\/\/[^\s)]+)/ig;
  while ((m = urlRe.exec(text)) !== null) {
    out.push({ label: null, href: m[1] });
  }
  return out;
}

function findSectionLink(text, headingRe) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  for (let i=0;i<lines.length;i++) {
    if (headingRe.test(lines[i])) {
      // scan next 6 lines for a markdown link or URL
      for (let j=i+1;j<Math.min(lines.length, i+7); j++) {
        const l = lines[j];
        const m = l.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.\/[^)\s]+|\/[^)\s]+|[^)]+\.md)\)/i);
        if (m) return { label: m[1], href: m[2], fromLine: j+1 };
        const u = l.match(/(https?:\/\/[^\s]+)/i);
        if (u) return { label: null, href: u[1], fromLine: j+1 };
      }
    }
  }
  return null;
}

for (const name of names) {
  const node = nodes.find(n=>n.name===name);
  if (!node) { console.log('Missing repo in projects.json:', name); continue; }
  console.log('\n---', name, '---');
  const readme = node.object && node.object.text;
  if (!readme) { console.log(' no README text'); continue; }
  // quick heuristic checks
  const links = findLinksInText(readme);
  const apiHead = findSectionLink(readme, /#{1,6}\s*api documentation hub|#{1,6}\s*api docs|#{1,6}\s*api documentation/i);
  const docHead = findSectionLink(readme, /#{1,6}\s*documentation/i);
  const archHead = findSectionLink(readme, /#{1,6}\s*architecture overview|#{1,6}\s*architecture/i);
  console.log('docsLink (existing):', node.docsLink);
  console.log('docsTitle (existing):', node.docsTitle);
  console.log('repoDocs present:', !!node.repoDocs);
  console.log('found apiHead:', apiHead);
  console.log('found docHead:', docHead);
  console.log('found archHead:', archHead);
  // show first 8 doc-like links
  const docLike = links.filter(l=>/docs?|redoc|openapi|swagger|api|\.md|github.io/i.test((l.label||'')+' '+(l.href||''))).slice(0,8);
  console.log('doc-like links (first 8):', docLike);
}

process.exit(0);
