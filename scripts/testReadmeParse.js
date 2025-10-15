const fs = require('fs');
const path = require('path');

// The fetchProjects.js exports no functions; instead we'll load public/projects.json and run the helper logic
// To reuse parsing code without major refactor, we'll execute the parse steps by requiring the file and invoking node.js

console.log('This test harness is informational. Please run `node scripts/fetchProjects.js` with a GH token to fully regenerate projects.');

const pj = path.join(__dirname, '..', 'public', 'projects.json');
if (!fs.existsSync(pj)) {
  console.error('public/projects.json not found. Run build or fetch script in CI to generate it.');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(pj, 'utf8'));
const inv = json.find(p => p.name === 'inventory-service');
if (!inv) {
  console.error('inventory-service entry not found in public/projects.json');
  process.exit(1);
}

console.log('SUMMARY:', inv.summary);
console.log('ABOUT excerpt:', ((inv.object && inv.object.text) || '').slice(0, 800));
console.log('TECH:', inv.technologies);
console.log('DOCS LEGACY:', inv.docsLink, inv.docsTitle);
console.log('DOCS STRUCTURED:', inv.docs);
console.log('MEDIA DOWNLOADED:', inv.mediaDownloaded);

console.log('\nFull object sample keys:', Object.keys(inv));
