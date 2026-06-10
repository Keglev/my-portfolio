# Scripts Index

[← Documentation root](../index.md)

This index covers the documentation for the build-time scripts in `scripts/`. The scripts form the data pipeline that fetches GitHub repository data, processes it, and writes the static `public/projects.json` consumed by the portfolio's React frontend. The documentation tooling scripts (`scripts/docs/`) are also documented here.

## Documents

| Document | Description |
|----------|-------------|
| [overview.md](overview.md) | What every script does — root-level entry points, `scripts/docs/` tooling, and all `scripts/lib/` submodules (`pipeline/`, `parseReadme/`, `docs/`, `media/`, `translation/`, `normalize/`, `readme/`, `summary/`) |

## References

- [Documentation root index](../index.md)
- [REFRESH.md](../REFRESH.md) — when and how to trigger a pipeline run
- [deploy/data-flow.md](../deploy/data-flow.md) — how pipeline outputs reach Vercel and GitHub Pages
- [architecture/ci-cd-pipeline.md](../architecture/ci-cd-pipeline.md) — which CI/CD step runs which script
