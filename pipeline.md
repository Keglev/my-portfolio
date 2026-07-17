# Pipeline Topology

[← Hub](https://keglev.github.io/my-portfolio/index.html) · [← Docs index](docs-index.html)

Short summary of the four-workflow CI/CD topology after the P4/P5 rework (2026-07-17). For full detail see [architecture/ci-cd-pipeline.md](architecture/ci-cd-pipeline.md).

## Workflows and concurrency groups

| Workflow | Trigger | Concurrency group |
|----------|---------|--------------------|
| `ci.yml` | Push to `main` (`src/**`, `scripts/**`, `config/**`, `jest.node.config.js`, `package.json`, `.github/workflows/**`), PRs | `portfolio-pipeline` |
| `deploy.yml` | Dispatched by `ci.yml` (always, on push); manual | `deploy-pipeline` |
| `api-docs.yml` | Dispatched by `ci.yml` (only if `apiDocs` or `coverage` is true); manual | `api-docs-pipeline` |
| `architecture-docs.yml` | Push to `docs/**` or `scripts/docs/**`; manual | `docs-only` |

Each of the four workflows has its **own** concurrency group. `deploy.yml` and `api-docs.yml` run in genuine parallel because they don't share a group — an earlier version that put them in `portfolio-pipeline` alongside `ci.yml` caused `deploy.yml` to be silently cancelled on every push (a queued run in a shared group is not protected by `cancel-in-progress: false`, only an in-progress run is). `api-docs.yml` and `architecture-docs.yml` additionally share a job-level `gh-pages-deploy` group so their `gh-pages` publishes never race.

## Live verification results (2026-07-17)

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | src-only push | `lint-and-test` → `deploy.yml` + `api-docs.yml` in parallel; `architecture-docs.yml` skipped | Pass |
| 2 | test-only push | `deploy.yml` + coverage publish; JSDoc rebuild skipped; `architecture-docs.yml` skipped | Pass |
| 3 | `docs/**`-only push | Only `architecture-docs.yml` runs; `ci.yml` doesn't trigger | Pass |
| 4 | gh-pages content | `/jsdoc/`, `/coverage/`, architecture pages, and root all reachable | Pass |

Two bugs were found and fixed during this verification, both now on `main`:

- Shared `portfolio-pipeline` concurrency group across `ci.yml`, `deploy.yml`, and `api-docs.yml` caused `deploy.yml`'s queued run to be silently cancelled by `api-docs.yml`'s queued run on every push — no Vercel deploy actually went out until this was fixed.
- An edit that expanded `deploy.yml`'s concurrency-group header comment accidentally deleted its `name:` and `on:` keys, leaving the workflow with no trigger.

## References

- [architecture/ci-cd-pipeline.md](architecture/ci-cd-pipeline.md) — full pipeline diagram, per-workflow step breakdown, concurrency strategy
- [architecture/decisions/ADR-004-three-workflow-cicd.md](architecture/decisions/ADR-004-three-workflow-cicd.md) — original three-workflow decision and its 2026-07-17 updates
- [deploy/data-flow.md](deploy/data-flow.md) — data flow into Vercel and GitHub Pages
