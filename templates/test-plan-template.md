# Test Plan: [Module or feature name]

[← Templates index](index.md)

One test plan per module or feature. Copy this file, name it after the module being tested (e.g. `test-plan-useProjects.md`), and complete each section before writing the tests. See [TESTS.md](../TESTS.md) for the project-wide testing strategy and runner configuration.

## Table of Contents

- [Scope](#scope)
- [Test Cases](#test-cases)
- [Coverage Targets](#coverage-targets)
- [How to Run](#how-to-run)
- [References](#references)

## Scope

What is covered by these tests and what is explicitly excluded.

Describe the file paths or features under test, the boundaries (e.g. "unit tests only — no network calls"), and the reason for any exclusions (e.g. "DOM rendering is excluded; covered by the CRA test suite").

## Test Cases

Add one row per scenario. Use ordered IDs so cases can be referenced unambiguously in code reviews and bug reports.

| ID | Description | Type | Expected result |
|----|-------------|------|-----------------|
| TC-01 | Describe the first scenario | unit / integration / e2e | What should happen |
| TC-02 | Describe the second scenario | unit / integration / e2e | What should happen |

## Coverage Targets

These are the minimum thresholds for this module. Adjust them downward only if the module is thin glue code with no branching logic, and document the reason.

| Metric | Target |
|--------|--------|
| Statements | 85% |
| Branches | 85% |
| Functions | 85% |
| Lines | 85% |

## How to Run

Ordered steps to execute these tests locally.

1. Install dependencies: `npm install`
2. Run the Node-only test suite: `npm run test:node`
3. Run the CRA test suite: `npm run test:cra`
4. Open the HTML coverage report: `coverage/index.html`

Replace steps 2–3 with the specific runner and flags for the module under test if it differs from the project defaults.

## References

- [TESTS.md](../TESTS.md) — project-wide testing strategy, runner configuration, and coverage thresholds
- [architecture/ci-cd-pipeline.md](../architecture/ci-cd-pipeline.md) — how coverage artifacts are collected and published in CI
