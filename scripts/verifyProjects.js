const fs = require('fs');
const p = 'public/projects.json';

// Exit 0 (not 1) — missing file is expected on docs-only builds that skip fetch.
if (!fs.existsSync(p)) { console.log('missing', p); process.exit(0); }

// '[]' fallback: readFileSync returns '' for a 0-byte file; JSON.parse('') throws.
const j = JSON.parse(fs.readFileSync(p, 'utf8') || '[]');
console.log('repos:', j.length);
for (const r of j) {
  const api = r.repoDocs?.apiDocumentation?.link || null;
  const arch = r.repoDocs?.architectureOverview?.link || null;
  console.log(r.name, 'docsLink->', r.docsLink || null, 'api->', api, 'arch->', arch);
}
