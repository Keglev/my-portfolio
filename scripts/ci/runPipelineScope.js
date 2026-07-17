/**
 * @file runPipelineScope.js
 * @module scripts/ci/runPipelineScope
 * @summary CLI wrapper around detectPipelineScope's resolveScope(): resolves
 * the changed-file list for a push's before/after SHA range and writes the
 * resulting scope flags to $GITHUB_OUTPUT.
 * @enterprise ci.yml's start-deploy-stage job only has a before/after SHA
 * pair, not a ready-made file list, and that range is not always usable —
 * github.event.before is the all-zero SHA on a brand-new branch, and a
 * force-push can rewrite the before commit out of reachable history. A
 * diff that cannot be computed must not silently skip docs/coverage work,
 * so this module treats "diff unavailable" as "run everything" rather than
 * "nothing changed". That decision lives here (testable) instead of inline
 * workflow YAML.
 */
const fs = require('fs');
const { execSync } = require('child_process');
const { resolveScope } = require('./detectPipelineScope');

const ZERO_SHA = '0'.repeat(40);

/**
 * @param {string} before - SHA before the push (github.event.before)
 * @param {string} after - SHA after the push (github.sha)
 * @param {(cmd: string) => string} exec - command runner, injected for testing
 * @returns {string[]|null} changed file paths, or null if the range could
 *   not be resolved (new branch, unreachable history, or a git failure)
 */
function resolveChangedFiles(before, after, exec = (cmd) => execSync(cmd, { encoding: 'utf8' })) {
  if (!before || before === ZERO_SHA) return null;

  try {
    exec(`git cat-file -e ${before}`);
    const out = exec(`git diff --name-only ${before} ${after}`);
    return out.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

/**
 * @param {string} before
 * @param {string} after
 * @param {(cmd: string) => string} [exec]
 * @returns {{apiDocs: boolean, coverage: boolean, archDocs: boolean, deploy: boolean}}
 */
function resolveScopeForRange(before, after, exec) {
  const changedFiles = resolveChangedFiles(before, after, exec);
  if (changedFiles === null) {
    return { apiDocs: true, coverage: true, archDocs: true, deploy: true };
  }
  return resolveScope(changedFiles);
}

function runCli() {
  const [, , before, after] = process.argv;
  const scope = resolveScopeForRange(before, after);

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

module.exports = { resolveChangedFiles, resolveScopeForRange };
