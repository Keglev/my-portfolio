# Tests — Strategy and How-to

This project uses two different Jest runners due to mixed runtime concerns:

1. Node-only scripts (scripts/):
   - These are pure Node modules used for build-time tasks (README parsing, media downloads, etc.).
   - They run under a dedicated Jest configuration (`jest.node.config.js`) which:
     - Mocks CSS and static assets.
     - Provides a small node setup (polyfills `fetch` via `node-fetch` v2) so code using `fetch` or other browser APIs can be tested.
   - Run locally: `npm run test:node`

2. React frontend (Create React App):
   - Uses CRA's test runner to ensure CSS and asset imports are handled the same way as in development.
   - Run locally: `npm run test:cra`

Combined runs
- Run both locally: `npm run test:all`
- CI (non-interactive): `npm run test:ci`

Why two runners?
- CRA injects its own Jest configuration and transform pipeline (Babel, CSS handling). Running CRA tests with raw Jest fails to parse CSS and static assets. To test node-only code without the CRA transforms, we use a separate jest config.

Files and locations
- `jest.node.config.js` — configuration used by `npm run test:node`.
- `scripts/jest/*` — small mocks and setup used by node Jest runs.
- `src/setupTests.js` — CRA test setup (loaded automatically by react-scripts).

Troubleshooting
- If React tests fail with CSS parsing errors when running raw `jest`, use `npm run test:cra` instead.
- If node tests complain about missing `fetch`, ensure `node-fetch` is installed as a devDependency (v2 recommended for CommonJS environments).

Next steps
- We'll document test patterns and add targeted tests for the parsing modules as the code is refactored further.
