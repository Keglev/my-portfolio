const { exec } = require('child_process');

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

  const metadata = report.metadata || report.metadata || {};
  const vulns = (metadata.vulnerabilities) ? metadata.vulnerabilities : {};
  const high = vulns.high || 0;
  const critical = vulns.critical || 0;

  console.log(`Vulnerabilities summary: low=${vulns.low||0} moderate=${vulns.moderate||0} high=${high} critical=${critical}`);

  if (high > 0 || critical > 0) {
    console.error('High or critical vulnerabilities found — failing audit job.');
    process.exit(1);
  }

  console.log('No high/critical vulnerabilities found.');
  process.exit(0);
});
