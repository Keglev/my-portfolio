/**
 * @file setup.js
 * @module config/vitest/setup
 * @summary Vitest setup: registers jest-dom's custom DOM matchers.
 * @enterprise This file replaces config/jest/setupTestsNode.js, which had
 * grown four responsibilities. Three of them died with the runner swap and
 * are recorded here so nobody reintroduces them:
 *
 * 1. `global.React = require('react')` -- a polyfill predating the automatic
 *    JSX runtime. Proven unnecessary by running the full suite without it
 *    (24/24 suites, 123/123 tests green). This was the open question tracked
 *    as CB-P8-01, now closed.
 * 2. A `node-fetch` polyfill for `global.fetch`. Node has had a native fetch
 *    since v18 and this project targets Node 24; the dependency was removed.
 * 3. Suppression of React's `ReactDOMTestUtils.act is deprecated` warning.
 *    The warning came from the compatibility layer in React Testing Library
 *    v13. RTL v16 does not emit it, so the suppression -- which worked by
 *    monkey-patching console.error and could hide unrelated errors -- is
 *    gone rather than carried forward.
 *
 * What remains is the one thing that genuinely needs global registration.
 */
import '@testing-library/jest-dom/vitest';
