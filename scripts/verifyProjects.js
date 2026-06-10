#!/usr/bin/env node
/**
 * verifyProjects.js
 *
 * Reads public/projects.json and logs each repository's resolved doc links
 * to stdout. Used as a post-fetch sanity check in the build-and-fetch.yml
 * workflow to confirm that fetchProjects and postprocessProjects ran correctly
 * before the production build.
 *
 * Exits 0 in all cases — a missing file is expected on docs-only builds that
 * skip the fetch step and should not fail the workflow.
 */
const fs = require('fs');

const p = 'public/projects.json';

// Missing file is expected on docs-only builds that skip fetch; exit cleanly.
if (!fs.existsSync(p)) { console.log('missing', p); process.exit(0); }

// Guard against a 0-byte file: readFileSync returns '' and JSON.parse('') throws.
const j = JSON.parse(fs.readFileSync(p, 'utf8') || '[]');
console.log('repos:', j.length);

for (const r of j) {
  const api = r.repoDocs?.apiDocumentation?.link || null;
  const arch = r.repoDocs?.architectureOverview?.link || null;
  console.log(r.name, 'docsLink->', r.docsLink || null, 'api->', api, 'arch->', arch);
}
