/**
 * scripts/audit-check.js
 * ----------------------
 * Runs `npm audit --json` and fails with non-zero exit code if any high or
 * critical vulnerabilities are reported. Intended to be useable from CI.
 */

const { exec } = require('child_process');

exec('npm audit --json', { maxBuffer: 1024 * 1024 * 5 }, (err, stdout) => {
  // If the process emitted an error and produced no stdout, consider the
  // audit command to have failed to execute and abort with a specific code.
  if (err && !stdout) {
    console.error('Failed to run npm audit:', err);
    process.exit(2);
  }

  let report;
  try {
    // Parse JSON audit output; if parsing fails we cannot make a decision
    // about vulnerability severity, so abort.
    report = JSON.parse(stdout);
  } catch (e) {
    console.error('Failed to parse npm audit output:', e);
    console.error(stdout);
    process.exit(2);
  }

  // Extract vulnerability counts from the audit report; default to 0 when
  // fields are missing to avoid exceptions.
  const metadata = report.metadata || report.metadata || {};
  const vulns = (metadata.vulnerabilities) ? metadata.vulnerabilities : {};
  const high = vulns.high || 0;
  const critical = vulns.critical || 0;

  console.log(`Vulnerabilities summary: low=${vulns.low||0} moderate=${vulns.moderate||0} high=${high} critical=${critical}`);

  // Fail the process in CI if any high/critical vulnerabilities are present.
  if (high > 0 || critical > 0) {
    console.error('High or critical vulnerabilities found — failing audit job.');
    process.exit(1);
  }

  console.log('No high/critical vulnerabilities found.');
  process.exit(0);
});
