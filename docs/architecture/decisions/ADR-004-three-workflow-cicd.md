# ADR-004: Three-Workflow CI/CD Architecture

[← Decisions index](index.md)

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Consequences](#consequences)
- [Update (2026-07-17)](#update-2026-07-17)
- [References](#references)

## Status

Accepted — topology since evolved to four workflows with parallel docs dispatch; see [Update](#update-2026-07-17) below. This section describes the original decision as made and is left unedited.

## Context

An initial single-workflow approach covering lint, test, build, fetch, and
deploy became difficult to maintain. It also caused unnecessary full re-runs
when only documentation files changed — there was no reason to re-run tests
and rebuild the React app for a Markdown edit.

A further constraint was coverage reporting: the test step produces a
coverage artifact that must reach the documentation site, but re-running
tests inside the docs workflow would be wasteful and could produce a
different result from the artifact that guarded the deployment.

## Decision

Split CI/CD into three sequential workflows, each with a single
responsibility:

- **`ci.yml`** — lint, run the full test suite with coverage, upload the
  `coverage-report` artifact (7-day retention). Triggers on push to `main`
  for source-affecting paths and on PRs to `main`. On a successful push,
  dispatches `build-and-fetch.yml`.

- **`build-and-fetch.yml`** — fetch pinned GitHub project data (GraphQL +
  DeepL translation), build the React app, assemble the Vercel Build Output
  API v3 prebuilt artifact, deploy to Vercel, smoke-test the deployment.
  Dispatches `docs-refresh.yml` on success.

- **`docs-refresh.yml`** — apply HTML templates to Markdown, pre-render
  Mermaid diagrams, generate JSDoc, download the `coverage-report` artifact
  from the latest successful `ci.yml` run, and publish `docs/` to the
  `gh-pages` branch. Also triggered directly on pushes to `docs/**` or
  `scripts/docs/**` to keep documentation edits fast.

All three workflows share the `portfolio-pipeline` concurrency group with
`cancel-in-progress: false`, so runs queue rather than cancel each other.
Docs-only pushes trigger `docs-refresh.yml` under a separate `docs-only`
concurrency group so they never block or are blocked by a full pipeline run.

A composite GitHub Action (`node-setup`) centralises the Node.js setup and
dependency caching step used by all three workflows.

## Consequences

- Coverage is computed once (in `ci.yml`) and reused; no risk of the
  published report diverging from the build that was actually deployed
- Each workflow can be triggered independently via `workflow_dispatch`
  for debugging or emergency re-runs
- Documentation-only edits publish in one workflow step without waiting
  for a full lint/build/deploy cycle
- The sequential dispatch chain (ci → build-and-fetch → docs-refresh) means
  a single push to `main` can take 10–20 minutes end-to-end
- Three workflow files are slightly more complex to onboard a new contributor
  than a single file
- The concurrency group prevents race conditions when multiple pushes land
  in quick succession

## Update (2026-07-17)

`build-and-fetch.yml` was renamed `deploy.yml` (it had already stopped fetching
project data — see [ADR-006](ADR-006-build-time-github-data-fetch.md)) and
`docs-refresh.yml` was split into two independently-triggered workflows,
`api-docs.yml` (JSDoc + coverage, dispatched by `ci.yml` in parallel with
`deploy.yml`, gated on whether the pushed diff could affect the API surface
or test coverage) and `architecture-docs.yml` (Markdown/Mermaid, triggers
only on `docs/**` pushes, unchanged from before). The sequential
ci → build-and-fetch → docs-refresh dispatch chain became a fan-out: `ci.yml`
now dispatches `deploy.yml` and `api-docs.yml` at the same time instead of
docs waiting on deploy to finish, and `scripts/ci/detectPipelineScope.js`
decides which workflows need to run at all.

The shared `portfolio-pipeline` concurrency group described in `Decision`
above does **not** carry over to the fan-out. `deploy.yml` and
`api-docs.yml` were first put in `portfolio-pipeline` alongside `ci.yml`
to match this ADR's original model, and it broke deploys in production:
GitHub Actions only protects an already **in-progress** run from
cancellation under `cancel-in-progress: false` — a **queued** run is not
protected, and is silently cancelled if a second run joins the same
group's queue first. Since `ci.yml` dispatches both workflows back to
back while its own run still holds the group, `api-docs.yml`'s queued run
was cancelling `deploy.yml`'s queued run on every push. The fix gives each
of `deploy.yml` and `api-docs.yml` its own concurrency group
(`deploy-pipeline`, `api-docs-pipeline`); `ci.yml` keeps `portfolio-pipeline`
for itself. See [ci-cd-pipeline.md](../ci-cd-pipeline.md#concurrency-strategy)
for the current four-group topology; the `Decision` and `Consequences`
sections above describe the original three-workflow shape, including its
single shared concurrency group, as it was when accepted — not the
corrected model in effect today.

## References

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [ci-cd-pipeline.md](../ci-cd-pipeline.md) — pipeline diagram and per-step breakdown
- `.github/workflows/ci.yml`
- `.github/workflows/build-and-fetch.yml` (now `deploy.yml`)
- `.github/workflows/docs-refresh.yml` (now split into `api-docs.yml` and `architecture-docs.yml`)
- `.github/actions/node-setup/` — composite action
