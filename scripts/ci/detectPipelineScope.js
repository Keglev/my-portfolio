/**
 * @file detectPipelineScope.js
 * @module scripts/ci/detectPipelineScope
 * @summary Maps a push diff's changed file paths to which downstream
 * pipeline work is needed: coverage publish and deploy.
 * @enterprise ci.yml needs to dispatch deploy.yml and coverage.yml in
 * parallel, and skip each when nothing that feeds it changed. GitHub Actions
 * path filters can gate an entire trigger but cannot express "a docs-only
 * change deploys nothing" on a single trigger -- that needs real logic,
 * which also means it can be unit tested
 * (see src/__tests__/scripts/ci/detectPipelineScope.test.js), unlike a
 * paths: filter block.
 */
const SRC_PREFIX = 'src/';
const SCRIPTS_DOCS_PREFIX = 'scripts/docs/';
const DOCS_PREFIX = 'docs/';

const isSrcPath = (file) => file.startsWith(SRC_PREFIX);
const isDocsPath = (file) => file.startsWith(DOCS_PREFIX) || file.startsWith(SCRIPTS_DOCS_PREFIX);

/**
 * @param {string[]} changedFiles - Repo-relative paths from a push diff
 * @returns {{coverage: boolean, deploy: boolean}}
 */
function resolveScope(changedFiles) {
  // The codeRef flag is gone with the site it gated (ADR-009). It used to
  // separate "the exported surface changed" from "only tests changed",
  // because the first needed a code-reference rebuild and the second did
  // not. Coverage never made that distinction -- it was true for either --
  // so removing codeRef collapses both cases into one src/** check rather
  // than losing a rule.
  //
  // archDocs is gone too: no workflow ever consumed it. architecture-docs.yml
  // self-triggers on its own docs/** paths, so the docs split needs no scope
  // flag. isDocsPath stays -- deploy is still defined as "any changed file
  // outside docs territory".
  const coverage = changedFiles.some(isSrcPath);
  const deploy = changedFiles.some((file) => !isDocsPath(file));

  return { coverage, deploy };
}

// resolveScope is a pure function with no CLI of its own. ci.yml resolves
// scope by calling runPipelineScope.js (argv-driven), which imports this
// module; the stdin-reading runCli that used to live here was never invoked
// by any workflow, so it was deleted along with its $GITHUB_OUTPUT plumbing.
module.exports = { resolveScope };
