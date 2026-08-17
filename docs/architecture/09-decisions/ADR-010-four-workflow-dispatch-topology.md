# ADR-010: Four-Workflow Dispatch Topology

[← Decisions index](index.md)

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Consequences](#consequences)
- [References](#references)

## Status

Accepted (2026-08-17).

Supersedes [ADR-004](ADR-004-three-workflow-cicd.md), whose three-workflow
sequential chain no longer exists. ADR-004's body is left as the record of
its era; this ADR describes the topology in effect today.

## Context

ADR-004 described three workflows dispatched in sequence
(`ci.yml` → `build-and-fetch.yml` → `docs-refresh.yml`). None of that shape
survives:

- `build-and-fetch.yml` became `deploy.yml` once the build-time GitHub fetch
  was retired ([ADR-006](ADR-006-build-time-github-data-fetch.md)).
- `docs-refresh.yml` was split into two independently-triggered workflows:
  `architecture-docs.yml` (Markdown/Mermaid) and the coverage/code-reference
  publisher, first named `api-docs.yml`.
- That publisher's code-reference half was retired
  ([ADR-009](ADR-009-retire-code-reference.md)) and the workflow renamed
  `coverage.yml`, leaving it a single-job coverage publisher.
- The sequential dispatch chain became a fan-out driven by resolved scope,
  and the single shared concurrency group that ADR-004 relied on turned out
  to break deploys in production and was replaced.

Enough has changed that ADR-004 is no longer a usable description of the
pipeline. This ADR records what actually runs.

## Decision

**Four workflows**, each with one responsibility:

- **`ci.yml`** — lint, dependency audit, full test suite with coverage, and
  the `coverage-report` artifact upload. Triggers on push to `main` for
  source- or build-affecting paths (`src/**`, `scripts/**`, `config/**`,
  `package.json`, `package-lock.json`, `vite.config.js`, `index.html`,
  `.github/workflows/**`) and on every pull request to `main`. On a
  successful push it runs `scripts/ci/runPipelineScope.js` to resolve scope,
  then dispatches `deploy.yml` and `coverage.yml`.
- **`deploy.yml`** — production Vite build, prebuilt-artifact assembly, and
  Vercel deploy. Dispatched by `ci.yml`, or manually.
- **`coverage.yml`** — downloads the coverage artifact from the latest
  successful `ci.yml` run, injects the back-to-docs link, and publishes it to
  `gh-pages` under `destination_dir: coverage`. Dispatched by `ci.yml`, or
  manually. Takes no inputs.
- **`architecture-docs.yml`** — applies doc templates, pre-renders Mermaid,
  and publishes the staged `docs/` tree to `gh-pages`. Self-triggers on
  `docs/**` or `scripts/docs/**` pushes; it is **not** dispatched by `ci.yml`.

**Two scope flags.** `resolveScope` (in `scripts/ci/detectPipelineScope.js`)
maps a push's changed paths to `{ coverage, deploy }`:

- `deploy` is true unless every changed path is under `docs/**` or
  `scripts/docs/**` — a docs-only push builds no bundle, so it deploys
  nothing.
- `coverage` is true when any `src/**` path changed.

`ci.yml` gates each dispatch on its flag: `deploy.yml` fires only when
`deploy` is true, `coverage.yml` only when `coverage` is true. An earlier
`archDocs` flag was removed because no workflow consumed it —
`architecture-docs.yml` expresses the docs split through its own `paths:`
trigger, not a flag.

**Concurrency.** Each workflow holds its own top-level concurrency group:
`portfolio-pipeline` (`ci.yml`), `deploy-pipeline` (`deploy.yml`),
`coverage-pipeline` (`coverage.yml`), and `docs-only`
(`architecture-docs.yml`). The separation is not cosmetic. `ci.yml`
dispatches `deploy.yml` and `coverage.yml` back to back while its own run
still holds `portfolio-pipeline`; GitHub Actions protects an already
in-progress run from cancellation under `cancel-in-progress: false`, but a
**queued** run is unprotected and is silently cancelled if another run joins
the same group's queue first. When all three shared one group, the
later-queued dispatch cancelled the earlier one on every push and deploys
silently never went out. Separate groups let the two dispatched workflows run
in parallel. See `.github/workflows/deploy.yml`'s header for the full account.

Separately, `coverage.yml` and `architecture-docs.yml` both publish to
`gh-pages` from independent triggers and could run at once. Both declare a
**job-level** `gh-pages-deploy` concurrency group — matched by name across
workflows — which serializes only their publish jobs, without touching either
workflow's top-level trigger group.

**Pull requests run the full gate, docs-only PRs included.** `ci.yml`'s
`pull_request` trigger has no path filter, so `lint-and-test` runs on every
PR. Skipping docs-only PRs would need a `paths-ignore` here plus a twin no-op
workflow reporting the same required-check name — branch protection matches
on the check name, so a genuinely skipped required job stays forever pending.
The suite is short enough that the extra workflow is not worth the saved
minute; the simpler topology was chosen deliberately.

## Consequences

- A single push to `main` fans out: build/deploy and coverage publishing run
  in parallel rather than one waiting on the other.
- A docs-only push to `main` dispatches neither `deploy.yml` nor
  `coverage.yml`; `architecture-docs.yml` still rebuilds the docs site from
  its own trigger.
- Because `ci.yml` no longer shares a concurrency group with the workflows it
  dispatches, a fresh `ci.yml` run can begin while a previous `deploy.yml` is
  still running. That overlap is accepted: `deploy.yml` self-serializes within
  `deploy-pipeline` and every dispatch runs `--ref main`, so the newest run
  always builds the latest `main` and a superseded intermediate deploy being
  dropped is the correct outcome.
- Four workflow files plus a scope-resolving script are more to onboard than
  ADR-004's three, but each file has a single clear trigger and
  responsibility.
- The scope logic lives in a unit-tested script
  (`scripts/ci/detectPipelineScope.js`), so the "what runs when" decision is
  assertable rather than buried in `paths:` filters.

## References

- [ci-cd-pipeline.md](../07-deployment.md) — pipeline diagram, per-step breakdown, and the concurrency-group table
- [ADR-004](ADR-004-three-workflow-cicd.md) — the superseded three-workflow topology
- [ADR-006](ADR-006-build-time-github-data-fetch.md) — why the fetch step (and `build-and-fetch.yml`) went away
- [ADR-009](ADR-009-retire-code-reference.md) — the code-reference retirement that renamed `api-docs.yml` to `coverage.yml`
- `.github/workflows/ci.yml`, `deploy.yml`, `coverage.yml`, `architecture-docs.yml`
- `scripts/ci/detectPipelineScope.js`, `scripts/ci/runPipelineScope.js`
