Security notes
==============

Current status
--------------
This project currently shows 2 moderate-severity vulnerabilities reported by `npm audit`.

Root cause
----------
- The vulnerabilities are caused by `webpack-dev-server` versions used by `react-scripts`.
- `react-scripts@5` depends on `webpack-dev-server@4.x`, which is affected by advisories that are considered moderate.

Why we didn't force-fix
----------------------
- The only available automated fix would require a breaking upgrade to `react-scripts` or migration away from Create React App (CRA).
- Upgrading `react-scripts` or migrating the build setup is non-trivial and may introduce breaking changes; it should be done as a planned change.

Recommended remediation path
----------------------------
1. Plan an upgrade to a newer `react-scripts` that resolves the underlying dev-server issue, or migrate to a modern build toolchain (Vite, Next.js, or a custom webpack configuration).
2. Apply the migration in a separate branch and run the full test and CI suite.
3. Re-run `npm audit` and verify the vulnerabilities are gone.

Short-term mitigation
---------------------
- We added a CI-friendly audit check (`npm run audit:ci`) which fails only when high or critical vulnerabilities are present. This prevents accidental acceptance of high-risk dependencies while avoiding forced breaking upgrades.

If you'd like help with migration or upgrading react-scripts, I can open a migration plan and implement it in a branch.
