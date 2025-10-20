#!/usr/bin/env node
// Light-weight orchestrator wrapper that delegates to scripts/lib/fetchPinned.js
const parseReadme = require('./lib/parseReadme');
const TOKEN = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;
// NOTE: do not exit at require-time so helper functions can be imported by other scripts.
// The token presence will be checked when running as a script (see bottom guard).

const { fetchPinned } = require('./lib/fetchPinned');

// Only run fetchPinned when the script is executed directly (not when required by tests)
if (require.main === module) {
  if (!TOKEN) {
    console.warn('No GitHub token found in environment. Skipping fetch.');
    process.exit(0);
  }
  fetchPinned().catch(e=>{ console.error('Unhandled error', (e && e.message) || e); process.exit(4); });
}

// Export helpers for unit tests (re-export parseReadme helpers)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseMarkdown: parseReadme.parseMarkdown,
    extractSectionWithRegex: parseReadme.extractSectionWithRegex,
    normalizeTitle: parseReadme.normalizeTitle,
    normalizeSummary: parseReadme.normalizeSummary,
    findImageCandidateFromAst: parseReadme.findImageCandidateFromAst,
    isBadgeLike: parseReadme.isBadgeLike,
    extractTechnologiesFromAst: parseReadme.extractTechnologiesFromAst,
    extractDocsFromAst: parseReadme.extractDocsFromAst
  };
  try { module.exports.extractRepoDocsDetailed = require('./lib/docs').extractRepoDocsDetailed; } catch (e) { /* ignore in some environments */ }
}
