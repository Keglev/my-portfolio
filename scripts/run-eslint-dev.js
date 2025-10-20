/**
 * scripts/run-eslint-dev.js
 * -------------------------
 * Small helper used during development to run eslint against the `src`
 * directory with strict settings so CI and local dev keep the same rules.
 *
 * Quick try-it (PowerShell):
 *   node .\scripts\run-eslint-dev.js
 */
const { execSync } = require('child_process');
process.env.NODE_ENV = 'development';
try {
  // Run eslint in a synchronous child process so CI/dev tooling reports
  // lint errors immediately; exit code is propagated to the caller.
  execSync('npx eslint src --format stylish --max-warnings 0', { stdio: 'inherit' });
  process.exit(0);
} catch (e) {
  // In case of a lint failure, forward the child exit code.
  process.exit(e.status || 1);
}
