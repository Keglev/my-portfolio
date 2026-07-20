#!/usr/bin/env node
/**
 * @file audit-check.js
 * @module scripts/audit-check
 * @summary Runs `npm audit --json` and fails the process if high or
 * critical vulnerabilities are found.
 * @enterprise Exits 1 on findings, 2 on execution or parse failure, 0 when
 * clean -- a distinct exit code for parse/exec failure vs. a real finding
 * lets a caller tell "audit itself broke" apart from "audit ran and found
 * problems." Invoked via the audit:ci npm script; not currently wired into
 * any CI workflow step, so it's a manual/local gate a developer runs
 * on demand, not an automated one.
 */
const { exec } = require('child_process');

// 5 MB buffer: npm audit --json output for large dependency trees can exceed
// the default 1 MB limit and cause a silent truncation error.
exec('npm audit --json', { maxBuffer: 1024 * 1024 * 5 }, (err, stdout) => {
  if (err && !stdout) {
    console.error('Failed to run npm audit:', err);
    process.exit(2);
  }

  let report;
  try {
    report = JSON.parse(stdout);
  } catch (e) {
    console.error('Failed to parse npm audit output:', e);
    console.error(stdout);
    process.exit(2);
  }

  const metadata = report.metadata || {};
  const vulns = metadata.vulnerabilities || {};
  const high = vulns.high || 0;
  const critical = vulns.critical || 0;

  console.log(`Vulnerabilities summary: low=${vulns.low||0} moderate=${vulns.moderate||0} high=${high} critical=${critical}`);

  if (high > 0 || critical > 0) {
    console.error('High or critical vulnerabilities found -- failing audit job.');
    process.exit(1);
  }

  console.log('No high/critical vulnerabilities found.');
  process.exit(0);
});