#!/usr/bin/env node
/**
 * run-eslint-dev.js
 *
 * Runs ESLint against the src/ directory with the CRA development config.
 * NODE_ENV must be 'development' to activate React-specific rules that CRA
 * suppresses in test and production environments.
 *
 * Exits 0 on clean lint, 1 on any warning or error (--max-warnings 0).
 * Used locally and in CI before the build step.
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
