#!/usr/bin/env node
/**
 * @file run-eslint-dev.js
 * @module scripts/run-eslint-dev
 * @summary Runs ESLint against src/ with the CRA development config active.
 * @enterprise NODE_ENV must be 'development' to activate React-specific
 * rules that CRA suppresses in test and production environments -- the
 * plain `npm run lint` script (eslint src --ext .js,.jsx) does not set
 * this, so it misses those dev-only rules. Exits 0 on clean lint, 1 on any
 * warning or error (--max-warnings 0). Documented in
 * docs/scripts/overview.md as a standalone tool; not currently wired into
 * package.json or any CI workflow, so it's a manual/local check a
 * developer runs on demand, not an automated gate.
 */
const { execSync } = require('child_process');

// CRA's ESLint config gates React plugin rules on NODE_ENV === 'development'.
process.env.NODE_ENV = 'development';

try {
  execSync('npx eslint src --format stylish --max-warnings 0', { stdio: 'inherit' });
  process.exit(0);
} catch (e) {
  process.exit(e.status || 1);
}
