# Backlog

[← Architecture index](index.md)

Master list of deferred work tracked via `// BUCKET: <text> (ID)` markers in
source. Open items keep their marker at the site; only closed IDs are
purged from both the marker and this list.

## Open

### CB-P10-01 — partition-completeness meta-test for coverage globs

**Site:** `vite.config.js`, the `test.coverage.thresholds` block.

**Context:** coverage thresholds are enforced per file through ten glob
groups rather than a project-wide setting, because Vitest applies a
top-level threshold to *every* file even when a glob entry also matches it —
which makes documented exceptions unreachable. The groups therefore have to
partition the measured tree between them.

Nothing currently enforces that partition. A source file matching none of
them is silently ungated, and a glob matching no files passes
silently while gating nothing. Both failure modes are invisible in a green
run: during P10-C step 3 the config passed cleanly at a point when four of
the groups were, in fact, enforcing nothing. That was caught only by
replicating Vitest's matcher by hand.

**Proposed fix:** a test that reads the threshold globs and the set of
measured files, then asserts every file matches exactly one group and every
group matches at least one file.

**Checked by hand each time the config changes**, which is the interim
control this entry describes rather than a substitute for it. Most recently
after the two static data configs left collection: 10 groups, 29 measured
files, every file matching exactly one group. The count in this entry is
maintained for the same reason — a stale number here would be the first
sign the check stopped happening.

**Why deferred:** the test needs the list of measured files, which only
exists after a coverage run has written `coverage/coverage-summary.json`.
Making a unit test depend on a prior coverage run — or reimplementing
Vitest's file-discovery to avoid that — is a fragile coupling, and a flaky
meta-test about coverage is worse than a documented risk. The config
comments state the constraint at the point of use in the meantime.

## Closed

The previous entry, **CB-P8-01** (verify the `global.React` polyfill's
necessity and its cross-realm behaviour under the CRA test runner), was
closed during the Vitest migration. The question it asked has no remaining
subject: the polyfill was proven unnecessary by running the full suite with
it removed, and both the file that held it (`config/jest/setupTestsNode.js`)
and the second test runner whose behaviour it questioned were deleted with
Create React App. See the runner-migration commit for the evidence.
