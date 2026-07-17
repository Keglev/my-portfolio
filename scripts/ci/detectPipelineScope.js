/**
 * @file detectPipelineScope.js
 * @module scripts/ci/detectPipelineScope
 * @summary Maps a push diff's changed file paths to which downstream
 * pipeline work is needed: JSDoc API docs, coverage publish, architecture
 * docs, and deploy.
 * @enterprise ci.yml needs to dispatch deploy.yml and the docs workflows in
 * parallel, and skip JSDoc/architecture-doc regeneration when nothing that
 * feeds them changed. GitHub Actions path filters can gate an entire
 * trigger but cannot express "test-only changes need coverage but not a
 * JSDoc rebuild" on a single trigger — that distinction needs real logic,
 * which also means it can be unit tested (see
 * src/__tests__/scripts/ci/detectPipelineScope.test.js), unlike a paths:
 * filter block.
 */
const fs = require('fs');

const SRC_TESTS_PREFIX = 'src/__tests__/';
const SRC_PREFIX = 'src/';
const SCRIPTS_LIB_PREFIX = 'scripts/lib/';
const SCRIPTS_DOCS_PREFIX = 'scripts/docs/';
const DOCS_PREFIX = 'docs/';
const JSDOC_CONFIG_FILE = 'jsdoc.json';

const isSrcTestPath = (file) => file.startsWith(SRC_TESTS_PREFIX);
const isSrcNonTestPath = (file) => file.startsWith(SRC_PREFIX) && !isSrcTestPath(file);
const isScriptsLibPath = (file) => file.startsWith(SCRIPTS_LIB_PREFIX);
const isJsdocConfigFile = (file) => file === JSDOC_CONFIG_FILE;
const isDocsPath = (file) => file.startsWith(DOCS_PREFIX) || file.startsWith(SCRIPTS_DOCS_PREFIX);

/**
 * @param {string[]} changedFiles - Repo-relative paths from a push diff
 * @returns {{apiDocs: boolean, coverage: boolean, archDocs: boolean, deploy: boolean}}
 */
function resolveScope(changedFiles) {
  const apiDocs = changedFiles.some(
    (file) => isSrcNonTestPath(file) || isScriptsLibPath(file) || isJsdocConfigFile(file)
  );
  const coverage = apiDocs || changedFiles.some(isSrcTestPath);
  const archDocs = changedFiles.some(isDocsPath);
  const deploy = changedFiles.some((file) => !isDocsPath(file));

  return { apiDocs, coverage, archDocs, deploy };
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

module.exports = { resolveScope };
