# Backlog

[← Hub](https://keglev.github.io/my-portfolio/index.html) · [← Docs index](docs-index.html)

Master list of deferred work tracked via `// BUCKET: <text> (ID)` markers in
source. Open items keep their marker at the site; only closed IDs are
purged from both the marker and this list.

## Open

### CB-P8-01 — verify React polyfill necessity + cross-realm behavior under CRA runner

**Site:** `config/jest/setupTestsNode.js`, the `global.React = require('react')`
polyfill block.

**Context:** while fixing a vacuous test assertion in
`src/__tests__/config/jest/setupTestsNode.test.js` (P8 batch 4a), discovered
that this polyfill behaves differently across the two Jest runners this repo
uses:

- Under `test:node` (the standalone `jest.node.config.js` runner), the
  polyfill works as intended: `global.React` is set to the real `react`
  module and is visible to code that reads it afterward.
- Under `test:cra` (`react-scripts test`, CRA's own Jest environment), the
  module executes in a different realm than the test file that requires it
  -- `global` inside `config/jest/setupTestsNode.js` is not the same object
  as `global` in the requiring test file. The assignment happens (verified
  via temporary debug logging during the P8 investigation) but is not
  observable from test code, making the polyfill effectively inert under
  this runner.

**Likely outcome:** CRA's runner uses the modern JSX transform and its own
`src/setupTests.js` bootstrap, which may mean a `global.React` polyfill was
never actually needed there in the first place -- older code sometimes
required a global React for the classic JSX transform or for
`react-dom/test-utils` compat shims, neither of which should apply here.
If so, the right fix is scoping (skip/remove the polyfill for the CRA
runner, or document that it's node-runner-only) rather than repairing the
cross-realm assignment to somehow work under CRA too.

**Why deferred:** proving which of those is true, and fixing it, is
source-level work (`config/jest/`) outside P8 batch 4's test-file-only
scope. The test itself now asserts only what is verifiably true per
runner (see `setupTestsNode.test.js`), so this doesn't block correctness
of the test suite -- it's a source-behavior question to resolve later.
