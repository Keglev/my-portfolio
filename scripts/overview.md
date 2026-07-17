# Scripts Overview

[← Scripts index](index.md)

The `scripts/` directory holds standalone build and quality-check tooling. There is no data-fetch pipeline: the Projects section renders from the static, hand-curated `src/data/projects.config.js`. The `scripts/docs/` subdirectory holds the documentation build tooling used by the `docs-refresh` workflow.

## Table of Contents

- [Root-Level Scripts](#root-level-scripts)
- [Documentation Generation Scripts](#documentation-generation-scripts)
- [References](#references)

## Root-Level Scripts

These scripts are executed directly by `npm run` commands or GitHub Actions workflow steps.

| Script | Purpose | Key inputs | Key outputs |
|--------|---------|-----------|------------|
| `audit-check.js` | Runs `npm audit --json`; fails the process if any high or critical vulnerabilities are found | npm audit JSON output | Exit code 0 (pass) / 1 (vulns found) / 2 (audit failed) |
| `run-eslint-dev.js` | Runs ESLint with `NODE_ENV=development` so CRA's React-specific rules activate; fails on any warning | `src/` directory | ESLint report via stylish formatter |
| `prepareVercelOutput.sh` | Assembles the Vercel Output API v3 artifact: resets `.vercel/output/`, copies `build/`, writes `config.json` | `build/` | `.vercel/output/static/` |

## Documentation Generation Scripts

Scripts in `scripts/docs/` are called by the `docs-refresh` GitHub Actions workflow to transform Markdown documentation into deployable HTML.

| Script | Purpose |
|--------|---------|
| `scripts/docs/build_docs.js` | Reads HTML templates from `scripts/docs/templates/`; converts every `docs/*.md` to `docs/*.html` using `page.html`; generates a sidebar TOC from h2/h3 headings; wraps Mermaid code blocks in `.mermaid-wrapper` divs; copies `hub.html` → `docs/index.html` and `styles.css` → `docs/templates/styles.css` |
| `scripts/docs/build_mermaid.js` | Scans the generated HTML files for Mermaid wrapper blocks and pre-renders them to inline SVG using `@mermaid-js/mermaid-cli` (`mmdc`); exits cleanly when `mmdc` is not installed so that client-side CDN rendering acts as the fallback |

## References

- [deploy/data-flow.md](../deploy/data-flow.md) — how script outputs flow to Vercel and GitHub Pages
- [architecture/ci-cd-pipeline.md](../architecture/ci-cd-pipeline.md) — which workflow step calls which script
