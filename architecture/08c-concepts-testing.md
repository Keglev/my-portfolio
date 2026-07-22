# Tests

[← Architecture index](index.md)

This project runs a single test runner — **Vitest** — over both the React
frontend components and the Node build scripts.

## Contents

- [Test runner](#test-runner)
- [Coverage](#coverage)
- [Running tests locally](#running-tests-locally)
- [Reading the coverage report](#reading-the-coverage-report)
- [What is tested and what is excluded](#what-is-tested-and-what-is-excluded)
- [Test doubles](#test-doubles)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## Test runner

Vitest exposes a **Jest-compatible API** — `describe`, `it`, `expect`,
`beforeEach`, and the mocking helpers all keep their names, with `vi`
replacing `jest` as the mock namespace. Tests run with `globals: true`, so
no per-file imports of those names are needed.

| Command | Description |
|---------|-------------|
| `npm test` | Runs the suite once and exits |
| `npm run test:watch` | Re-runs affected tests on file change |
| `npm run test:coverage` | Runs once with an instrumented coverage report |

**Why one runner.** The project previously ran two Jest configurations —
CRA's built-in runner and a standalone `jest.node.config.js` — because CRA
injected its own Babel and CSS transform pipeline that raw Jest could not
reproduce. Comparing `--listTests` output from each showed both were
executing the *identical* set of files: one suite run twice, not two suites.
Vitest removes the reason for the split entirely, because it transforms test
files with the same Vite pipeline that builds the app. The transform under
test is therefore provably the transform that ships.

All configuration lives in the `test` block of `vite.config.js`, alongside
the build config, so the two cannot drift apart. See
[ADR-007](09-decisions/ADR-007-vite-migration.md) for the build-tooling
decision that made this possible.

## Coverage

Coverage uses the **istanbul** provider, not Vitest's default v8. The two
report different branch percentages for identical code, and this project's
coverage plan was baselined under istanbul; pinning the provider keeps the
numbers comparable across the runner change.

No minimum coverage thresholds are enforced yet. Run `npm run test:coverage`
to generate a local HTML report with statements, branches, functions, and
line coverage.

Coverage is collected from `src/**/*.{js,jsx}`, `scripts/**/*.js`, and
`config/**/*.js`.

## Running tests locally

1. Install dependencies: `npm install`
2. Run the suite: `npm test`
3. Iterate with watch mode: `npm run test:watch`
4. Generate a coverage report: `npm run test:coverage`

## Reading the coverage report

After running `npm run test:coverage`, open `coverage/index.html` in a
browser for the line-by-line HTML report. A machine-readable summary is also
written to `coverage/coverage-summary.json`, and `coverage/lcov.info` is the
artifact CI uploads for republication.

The deployed coverage report is available at
[keglev.github.io/my-portfolio/coverage/index.html](https://keglev.github.io/my-portfolio/coverage/index.html).

## What is tested and what is excluded

Tested source locations:

- `src/**/*.{js,jsx}` — React components, context, and config modules
- `scripts/**/*.js` — CI scope-resolution and documentation build scripts

Intentionally excluded from coverage:

- Test files and fixtures (`src/__tests__/`, `__mocks__/`)
- Test infrastructure (`config/vitest/`)
- Standalone operator scripts (`audit-check.js`), run by hand and not part
  of the application

`audit-check.js` runs `npm audit --json` and fails on any high or critical
finding. The `overrides` block it used to work around no longer exists:
every entry pinned a vulnerable transitive of `react-scripts`, and all of
them left with CRA.

## Test doubles

Vite handles CSS and static-asset imports natively, so the CRA-era style and
file mocks are gone. Two deliberate doubles remain:

| Double | Location | Why |
|--------|----------|-----|
| `@vercel/speed-insights/react` | `config/vitest/speedInsightsMock.js`, wired via `test.alias` | The real SDK would initialise live telemetry during component tests |
| `react-scroll` | `__mocks__/react-scroll.jsx` | Its `Link` registers a scroll-spy handler on mount that jsdom cannot satisfy |

The `react-scroll` mock lives at the repo root because Vitest resolves manual
mocks for `node_modules` packages relative to the project root. Unlike Jest,
Vitest does **not** apply it automatically — each test file that needs it
must call `vi.mock('react-scroll')` explicitly.

## Troubleshooting

- **A mocked module is ignored and the real one runs.** Vitest keys its mock
  registry on the exact specifier. Mocking `'child_process'` does not cover
  `'node:child_process'`, or vice versa — register both when the module under
  test could use either.
- **A module reports 0% coverage although its tests pass.** The test is
  almost certainly loading it with `require()` instead of `import`. CommonJS
  requires bypass Vitest's instrumented transform, so the code runs and the
  assertions pass while nothing is measured.
- **A module-scope side effect does not re-run between tests.** Dynamic
  `import()` is served from the module cache; call `vi.resetModules()` first.

## References

- [Vitest documentation](https://vitest.dev/)
- [Vitest — migrating from Jest](https://vitest.dev/guide/migration.html)
- [Testing Library documentation](https://testing-library.com/docs/)
- [ADR-007](09-decisions/ADR-007-vite-migration.md) — the Vite migration that made a single runner possible
