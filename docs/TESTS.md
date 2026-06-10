# Tests

[← Hub](https://keglev.github.io/my-portfolio/index.html) · [← Docs index](docs-index.html)

This project uses two separate Jest runners to handle the mixed runtime requirements of Node build scripts and React frontend components.

## Contents

- [Test runners](#test-runners)
- [Coverage](#coverage)
- [Running tests locally](#running-tests-locally)
- [Reading the coverage report](#reading-the-coverage-report)
- [What is tested and what is excluded](#what-is-tested-and-what-is-excluded)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## Test runners

Two runners are needed because CRA injects its own Babel and CSS transform pipeline; running CRA tests with raw Jest fails to parse CSS and static asset imports.

| Runner | Command | Config | Scope |
|--------|---------|--------|-------|
| Node | `npm run test:node` | `jest.node.config.js` | `src/__tests__/` |
| CRA | `npm run test:cra` | CRA built-in | `src/**/*.test.{js,jsx}` |

Combined commands:

| Command | Description |
|---------|-------------|
| `npm run test:all` | Runs both runners sequentially |
| `npm run test:ci` | Non-interactive CI mode for both runners |
| `npm run test:helpers` | Runs only `src/__tests__/fetchHelpers` |

## Coverage

No minimum coverage thresholds are currently enforced. Run `npm run test:node -- --coverage` to generate a local HTML report and view current percentages. The report includes statements, branches, functions, and line coverage.

Coverage is collected from `config/jest/**/*.js`, `src/**/*.{js,jsx}`, and `scripts/**/*.js`.

## Running tests locally

1. Install dependencies: `npm install`
2. Run the Node runner: `npm run test:node`
3. Run the CRA runner: `npm run test:cra`
4. Run both at once: `npm run test:all`
5. For CI (non-interactive, no watch mode): `npm run test:ci`

## Reading the coverage report

After running `npm run test:node -- --coverage`, open `coverage/index.html` in a browser to see the full line-by-line HTML report. A machine-readable summary is also written to `coverage/coverage-summary.json`.

The deployed coverage report is available at
[keglev.github.io/my-portfolio/coverage/index.html](https://keglev.github.io/my-portfolio/coverage/index.html).

## What is tested and what is excluded

Tested source locations:

- `src/**/*.{js,jsx}` — React components and hooks
- `scripts/**/*.js` — build-time scripts (README parsing, media downloads, postprocessing)
- `config/jest/**/*.js` — Jest configuration helpers

Intentionally excluded from coverage:

- Test files (`__tests__/`, `*.test.js`, `*.spec.js`)
- CRA test setup (`setupTests.js`)
- Standalone debug and audit scripts (`debugRepoDocs.js`, `audit-check.js`)

## Troubleshooting

- **CSS parsing errors when running raw `jest`** — use `npm run test:cra` instead, which uses CRA's transform pipeline.
- **Missing `fetch` in Node tests** — confirm that `node-fetch` v2 is installed as a devDependency (`npm install --save-dev node-fetch@2`).

## References

- [Jest documentation](https://jestjs.io/docs/getting-started)
- [Create React App — running tests](https://create-react-app.dev/docs/running-tests/)
- [Testing Library documentation](https://testing-library.com/docs/)
