#!/usr/bin/env node
/**
 * fetchProjects.js
 *
 * CLI entry point for fetching pinned GitHub repositories and enriching
 * them with README data. Delegates all logic to lib/fetchPinned and
 * lib/parseReadme.
 *
 * Dual-use module:
 *   - Run directly (`node scripts/fetchProjects.js`) to refresh projects.json.
 *   - Required by other scripts (e.g. applyFallbackDocScan.js) to access
 *     parseReadme utilities without re-running the fetch.
 *
 * Called by the build-and-fetch.yml workflow after secrets are available.
 * Never called by Vercel directly — the buildCommand in vercel.json skips
 * the prebuild step.
 */
const parseReadme = require('./lib/parseReadme');
const { fetchPinned } = require('./lib/fetchPinned');

if (require.main === module) {
  fetchPinned().catch(e => {
    console.error('Unhandled error in fetchPinned:', (e && e.message) || e);
    process.exit(4);
  });
}

// Re-export parseReadme utilities so callers don't need to know the internal
// module path. extractRepoDocsDetailed is optional — not available in all
// environments (e.g. stripped builds) — so the require is guarded.
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
  try {
    module.exports.extractRepoDocsDetailed = require('./lib/docs').extractRepoDocsDetailed;
  } catch (e) { /* not available in all environments */ }
}
