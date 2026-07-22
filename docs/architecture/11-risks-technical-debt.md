# Backlog

[← Architecture index](index.md)

Master list of deferred work tracked via `// BUCKET: <text> (ID)` markers in
source. Open items keep their marker at the site; only closed IDs are
purged from both the marker and this list.

## Open

None.

The most recent entry, **CB-P8-01** (verify the `global.React` polyfill's
necessity and its cross-realm behaviour under the CRA test runner), was
closed during the Vitest migration. The question it asked has no remaining
subject: the polyfill was proven unnecessary by running the full suite with
it removed, and both the file that held it (`config/jest/setupTestsNode.js`)
and the second test runner whose behaviour it questioned were deleted with
Create React App. See the runner-migration commit for the evidence.
