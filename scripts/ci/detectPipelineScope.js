/**
 * @file detectPipelineScope.js
 * @module scripts/ci/detectPipelineScope
 * @summary Maps a push diff's changed file paths to which downstream
 * pipeline work is needed: coverage publish, architecture docs, and deploy.
 * @enterprise ci.yml needs to dispatch deploy.yml and the docs workflows in
 * parallel, and skip work when nothing that feeds it changed. GitHub Actions
 * path filters can gate an entire trigger but cannot express "a docs-only
 * change deploys nothing but still rebuilds the docs site" on a single
 * trigger -- that needs real logic, which also means it can be unit tested
 * (see src/__tests__/scripts/ci/detectPipelineScope.test.js), unlike a
 * paths: filter block.
 */
const fs = require('fs');

const SRC_PREFIX = 'src/';
const SCRIPTS_DOCS_PREFIX = 'scripts/docs/';
const DOCS_PREFIX = 'docs/';

const isSrcPath = (file) => file.startsWith(SRC_PREFIX);
const isDocsPath = (file) => file.startsWith(DOCS_PREFIX) || file.startsWith(SCRIPTS_DOCS_PREFIX);

/**
 * @param {string[]} changedFiles - Repo-relative paths from a push diff
 * @returns {{coverage: boolean, archDocs: boolean, deploy: boolean}}
 */
function resolveScope(changedFiles) {
  // The codeRef flag is gone with the site it gated (ADR-009). It used to
  // separate "the exported surface changed" from "only tests changed",
  // because the first needed a code-reference rebuild and the second did
  // not. Coverage never made that distinction -- it was true for either --
  // so removing codeRef collapses both cases into one src/** check rather
  // than losing a rule.
  const coverage = changedFiles.some(isSrcPath);
  const archDocs = changedFiles.some(isDocsPath);
  const deploy = changedFiles.some((file) => !isDocsPath(file));

  return { coverage, archDocs, deploy };
}

/**
 * CLI entry: reads a newline-separated changed-file list from stdin
 * (workflows supply it via `git diff --name-only <before> <sha>`) and
 * writes the resolved scope flags to $GITHUB_OUTPUT.
 */
function runCli() {
  const stdin = fs.readFileSync(0, 'utf8');
  const changedFiles = stdin.split('\n').map((line) => line.trim()).filter(Boolean);
  const scope = resolveScope(changedFiles);

  const outputPath = process.env.GITHUB_OUTPUT;
  const lines = Object.entries(scope).map(([key, value]) => `${key}=${value}`);
  if (outputPath) {
    fs.appendFileSync(outputPath, lines.join('\n') + '\n');
  } else {
    lines.forEach((line) => console.log(line));
  }
}

if (require.main === module) {
  runCli();
}

// runCli is exported for testing only -- the CLI guard above is what runs it
// in production. Its stdin parsing and the $GITHUB_OUTPUT-vs-stdout fallback
// are real behaviour that ci.yml depends on, so they need to be assertable.
module.exports = { resolveScope, runCli };
