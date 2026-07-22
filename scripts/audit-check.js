#!/usr/bin/env node
/**
 * @file audit-check.js
 * @module scripts/audit-check
 * @summary Runs `npm audit --json` and fails the process if high or
 * critical vulnerabilities are found outside the documented allowlist.
 * @enterprise Exits 1 on findings, 2 on execution or parse failure, 0 when
 * clean -- a distinct exit code for parse/exec failure vs. a real finding
 * lets a caller tell "audit itself broke" apart from "audit ran and found
 * problems." Invoked via the audit:ci npm script; not currently wired into
 * any CI workflow step, so it's a manual/local gate a developer runs
 * on demand, not an automated one.
 */
const { exec } = require('child_process');

/**
 * Waived high/critical findings, keyed by the vulnerable package name.
 *
 * A waiver is not "we looked and it seemed fine": each entry names the path
 * the package arrives by, why it cannot reach a user, and what would end the
 * waiver. Everything here is dev-only -- none of these packages appear in the
 * browser bundle, and all of them process only this repository's own files.
 *
 * Waived by package name, not advisory id: npm renumbers advisories when it
 * merges or re-issues them, and a waiver that silently stops matching is
 * worse than no waiver. evaluate() reports entries that match nothing, so a
 * stale waiver survives at most one run past its finding.
 */
const ALLOWLIST = {
  'linkify-it': {
    // jsdoc -> markdown-it -> linkify-it. Quadratic-complexity DoS in the
    // mailto: validator, reachable only by feeding it attacker-controlled
    // markdown. The only markdown it ever sees is the JSDoc comments in this
    // repository, at docs-build time, on a CI runner. No fix is available
    // upstream. Ends when JSDoc drops markdown-it, or if the Code Reference
    // is ever dropped -- ADR-008 chose to keep it, this waiver is the price.
    reason: 'dev-only, jsdoc -> markdown-it; no fix available; parses only this repo\'s own comments',
  },
  'brace-expansion': {
    // eslint-plugin-jsx-a11y and eslint-plugin-testing-library, both via
    // minimatch. DoS via exponential expansion of a crafted glob. The globs
    // it expands are the ones in this repository's ESLint config. Arrived
    // with the ESLint 9 toolchain of the Vite migration (ADR-007), not
    // through JSDoc. Ends when those plugins ship a patched minimatch range.
    reason: 'dev-only, eslint plugins -> minimatch; expands only this repo\'s own globs',
  },
};

/**
 * Splits a parsed `npm audit --json` report into what fails the check and
 * what is waived.
 *
 * @param {object} report - Parsed `npm audit --json` output
 * @param {Record<string, {reason: string}>} [allowlist]
 * @returns {{blocking: string[], waived: string[], stale: string[]}}
 */
function evaluate(report, allowlist = ALLOWLIST) {
  const found = Object.entries(report.vulnerabilities || {})
    .filter(([, vuln]) => vuln.severity === 'high' || vuln.severity === 'critical')
    .map(([name]) => name);

  return {
    blocking: found.filter((name) => !allowlist[name]),
    waived: found.filter((name) => allowlist[name]),
    stale: Object.keys(allowlist).filter((name) => !found.includes(name)),
  };
}

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

  const vulns = (report.metadata || {}).vulnerabilities || {};
  const { blocking, waived, stale } = evaluate(report);

  console.log(`Vulnerabilities summary: low=${vulns.low||0} moderate=${vulns.moderate||0} high=${vulns.high||0} critical=${vulns.critical||0}`);

  waived.forEach((name) => console.log(`Waived (allowlist): ${name} -- ${ALLOWLIST[name].reason}`));
  // Not a failure, but not silent either: an entry matching nothing is a
  // waiver that has outlived its finding and should be deleted.
  stale.forEach((name) => console.log(`Stale allowlist entry, no longer reported: ${name}`));

  if (blocking.length > 0) {
    console.error(`High or critical vulnerabilities found outside the allowlist: ${blocking.join(', ')}`);
    process.exit(1);
  }

  console.log('No high/critical vulnerabilities outside the allowlist.');
  process.exit(0);
});

module.exports = { evaluate, ALLOWLIST };
