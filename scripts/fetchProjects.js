#!/usr/bin/env node
/**
 * scripts/fetchProjects.js
 * ------------------------
 * Orchestrator script that delegates to the pipeline implementation
 * in `scripts/lib/fetchPinned.js` and re-exports a small set of
 * parse helpers for unit tests.
 *
 * Behavior notes:
 * - This file intentionally does NOT abort at require-time so test
 *   runners can import the helper functions without side-effects.
 * - When executed directly (node scripts/fetchProjects.js) it will
 *   check for a GitHub token and run the fetch pipeline.
 *
 * Environment variables consumed:
 * - GH_PROJECTS_TOKEN or GITHUB_TOKEN : optional GitHub token used by pipeline
 * - DEBUG (optional) : when set, tests and scripts may produce more logs
 *
 * Exported helpers (re-exports from parseReadme):
 * - parseMarkdown(text) -> AST
 * - extractSectionWithRegex(text, regexes) -> string|null
 * - normalizeTitle(title) -> string
 * - normalizeSummary(text) -> string
 * - findImageCandidateFromAst(ast) -> string|null
 * - isBadgeLike(text) -> boolean
 * - extractTechnologiesFromAst(ast) -> string[]
 * - extractDocsFromAst(ast) -> object|null
 *
 * This file is intentionally small; most pipeline logic lives in
 * `scripts/lib/fetchPinned.js` and the parse helpers under
 * `scripts/lib/parseReadme`.
 *
 * Quick try-it (PowerShell):
 *   $env:GH_PROJECTS_TOKEN = 'ghp_xxx'; node .\scripts\fetchProjects.js
 */

// Re-usable parsing helpers (re-exported at bottom for tests)
const parseReadme = require('./lib/parseReadme');

// Prefer GH_PROJECTS_TOKEN for clarity, fallback to generic GITHUB_TOKEN
// (kept in other modules). Tests import this module directly so the
// presence of the token is checked when the pipeline runs.

// NOTE: do not exit at require-time so helper functions can be imported by other scripts.
// The token presence will be checked when running as a script (see bottom guard).
const { fetchPinned } = require('./lib/fetchPinned');

// When executed directly from node, run the fetch pipeline.
// This guard prevents the pipeline from running during unit tests where
// the module is required to re-export helper functions.
// When executed directly from the CLI, run the fetch pipeline. This guard
// prevents running the network-heavy pipeline during unit tests which only
// need to re-export helper functions.
if (require.main === module) {
  // Run the pipeline. If a GitHub token is available the pipeline will
  // query the GraphQL API; if not, fetchPinned() will attempt to load
  // an existing `public/projects.json` and re-process those nodes.
  fetchPinned().catch(e => {
    console.error('Unhandled error in fetchPinned:', (e && e.message) || e);
    process.exit(4);
  });
}

// Export small helpers for unit tests (re-export parseReadme helpers)
// Export small helpers for unit tests (re-export parseReadme helpers). We only
// export a thin shim so callers can import parsing utilities without running
// the whole fetch pipeline.
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
  // Some environments may not have the docs helper available; swallow the error
  // so tests that only import this file don't fail during require().
  try {
    module.exports.extractRepoDocsDetailed = require('./lib/docs').extractRepoDocsDetailed;
  } catch (e) {
    /* intentionally ignore: helper not available in all environments */
  }
}
