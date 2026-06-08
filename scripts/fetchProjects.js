#!/usr/bin/env node
const parseReadme = require('./lib/parseReadme');
const { fetchPinned } = require('./lib/fetchPinned');

if (require.main === module) {
  fetchPinned().catch(e => {
    console.error('Unhandled error in fetchPinned:', (e && e.message) || e);
    process.exit(4);
  });
}

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
