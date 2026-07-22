# Crosscutting Concepts: Build Tooling

[← Architecture index](index.md)

The `scripts/` directory holds standalone build and quality-check tooling. There is no data-fetch pipeline: the Projects section renders from the static, hand-curated `src/data/projects.config.js`. The `scripts/docs/` subdirectory holds the documentation-site build tooling used to produce this very page.

## Table of Contents

- [Root-Level Scripts](#root-level-scripts)
- [Documentation Generation Scripts](#documentation-generation-scripts)
- [References](#references)

## Root-Level Scripts

These scripts are executed directly by `npm run` commands or GitHub Actions workflow steps.

| Script | Purpose | Key inputs | Key outputs |
|--------|---------|-----------|------------|
| `audit-check.js` | Runs `npm audit --json`; fails the process if any high or critical vulnerabilities are found | npm audit JSON output | Exit code 0 (pass) / 1 (vulns found) / 2 (audit failed) |
| `prepareVercelOutput.sh` | Assembles the Vercel Output API v3 artifact: resets `.vercel/output/`, copies `dist/`, writes `config.json`; fails loudly if `dist/` is missing | `dist/` | `.vercel/output/static/` |

## Documentation Generation Scripts

Scripts in `scripts/docs/` are called by the `architecture-docs.yml` GitHub Actions workflow to transform Markdown documentation into the deployable HTML site under `docs/_theme/`.

| Script | Purpose |
|--------|---------|
| `scripts/docs/build_docs.js` | Reads the page-shell templates from `docs/_theme/templates/`; converts every `docs/*.md` to `docs/*.html`, skipping `docs/jsdoc/`, `docs/coverage/`, and `docs/_theme/`; generates a sidebar TOC from h2/h3 headings; wraps Mermaid code blocks in `.mermaid-wrapper` divs; concatenates the split CSS sources under `docs/_theme/css/` into `docs/_theme/css/styles.css`; assembles the bilingual landing (`landing-en.html`/`landing-de.html`) into `docs/index.html` and `docs/index-de.html` |
| `scripts/docs/build_mermaid.js` | Scans the generated HTML files (excluding `jsdoc/`, `coverage/`, `_theme/`) for Mermaid wrapper blocks and pre-renders them to inline SVG using `@mermaid-js/mermaid-cli` (`mmdc`); exits cleanly when `mmdc` is not installed so that client-side CDN rendering acts as the fallback |

## References

- [Context and Scope](03-context.md) — how script outputs flow to Vercel and GitHub Pages
- [Deployment](07-deployment.md) — which workflow step calls which script
