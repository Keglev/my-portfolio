#!/usr/bin/env node
const { execSync } = require('child_process');
// NODE_ENV must be 'development' so the CRA ESLint config activates React-specific rules
process.env.NODE_ENV = 'development';
try {
  execSync('npx eslint src --format stylish --max-warnings 0', { stdio: 'inherit' });
  process.exit(0);
} catch (e) {
  process.exit(e.status || 1);
}
