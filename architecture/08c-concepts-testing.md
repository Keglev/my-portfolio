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

Coverage is collected from `src/**/*.{js,jsx}`, `scripts/**/*.js`, and
`config/**/*.js`. Run `npm run test:coverage` for a local HTML report.

### Enforced thresholds

**85% statements, branches, functions, and lines — enforced per file.** CI
fails if any module drops below it.

Per file, not as a project aggregate. An aggregate percentage lets a
well-covered module mask an untested one: adding a fully covered file raises
the project total while the untested file stays exactly as untested as
before. Per-file means every module carries its own weight.

### Exceptions

Four modules are held to lower numbers. Each is a case where 85% is only
reachable through filler assertions, or through a change that would make the
suite worse than the gap it closes. The thresholds are set at or just under
the measured value, so they are regression guards — a **drop** still fails
the build.

| Module | Held at | Uncovered mechanism |
|---|---|---|
| `scripts/docs/build_mermaid.js` | 65 / 45 / 90 / 65 | `renderDiagram` and `run`'s rendering loop need a real `mmdc` binary. Covering them means adding `@mermaid-js/mermaid-cli` (and Chromium) as a devDependency, or mocking the subprocess under test. The path CI actually takes — mmdc absent, clean no-op exit — *is* covered. |
| `scripts/docs/lib/markedConfig.js` | 80 / 45 / 90 / 80 | Two load-time `process.exit` fail-fast paths and the library-version resolution ternaries. All run at import, before any export exists, through a CommonJS `require` that `vi.mock` cannot intercept. |
| `scripts/docs/build_docs.js` | 95 / 50 / 90 / 95 | Branch gap only. The uncovered branches are CLI default-param bindings; exercising them requires letting a test write to the real, tracked `docs/` tree. |
| `scripts/ci/detectPipelineScope.js` | 96 / 83 / 100 / 95 | Branch gap only. The one uncovered branch is the `require.main === module` CLI guard, which cannot be exercised in-process — running the file as a child process is not instrumented. It fell below the group threshold only when the file shrank (see [ADR-009](09-decisions/ADR-009-retire-code-reference.md)); the same single branch simply became a larger share of a smaller total. |

Three files are excluded from collection outright, on the same principle:
data is not code. The translation catalogues (`src/i18n/locales/*.json`),
and `src/data/projects.config.js` and `src/data/skills.config.js` — exported
array literals of hand-written copy that happen to live in `.js` because they
reference i18n keys. Measuring them put a 0% row on the published report that
reads as untested code, when the only test that would move it is an assertion
on their length or contents.

`src/data/cvAssets.config.js` is deliberately *not* excluded despite the
filename. `getCvFile()` has a real branch — regional codes such as `de-DE`
must resolve to the German PDF, which was a genuine bug once — so it is code,
and it is held to the full 85%.

Adding an entry to this list requires the same justification these carry —
name the specific uncovered mechanism, and say what covering it would cost.

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
