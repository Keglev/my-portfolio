# Solution Strategy

[← Architecture index](index.md)

The handful of decisions that shaped everything else, distinct from the [Constraints](02-constraints.md) they respond to. Each links to the full [ADR](09-decisions/index.md) or chapter where it's discussed in detail.

## Table of Contents

- [Technology Decisions](#technology-decisions)
- [Top-Level Decomposition](#top-level-decomposition)
- [Achieving Quality Goals](#achieving-quality-goals)
- [References](#references)

## Technology Decisions

- **React with Create React App, not ejected** — mature ecosystem, zero-config build tooling. See [ADR-001](09-decisions/ADR-001-react.md).
- **styled-components over plain CSS modules** — co-located styles, no class-name collisions. See [ADR-003](09-decisions/ADR-003-styling-approach.md).
- **i18next for internationalisation, default locale German** — industry-standard React i18n, and the portfolio targets a German-speaking job market. See [ADR-002](09-decisions/ADR-002-i18next-internationalization.md).
- **Vercel prebuilt artifact deployment** — the app is built once in GitHub Actions and deployed as a finished `.vercel/output` artifact, keeping full control over the build environment instead of letting Vercel rebuild from source. See [ADR-005](09-decisions/ADR-005-vercel-hosting.md).

## Top-Level Decomposition

- **Static, hand-curated project data** — project copy, tech tags, and images live in `src/data/projects.config.js` and are bundled at build time, removing any GitHub API dependency from the live site. An earlier build-time fetch pipeline was retired in favor of this. See [ADR-006](09-decisions/ADR-006-build-time-github-data-fetch.md).
- **No client-side state library** — component-local `useState` is sufficient; no shared mutable state exists across unrelated components. See [Runtime View](06-runtime.md).
- **Single-page, scroll-based navigation** — no `react-router-dom` routes; one document, sidebar links smooth-scroll to sections. See [Runtime View: Routing](06b-runtime-routing.md).

## Achieving Quality Goals

- **Reliability**: two separate Jest runners — Node-only scripts use a config independent of the CRA runner, avoiding Babel/CSS transform conflicts that would otherwise make one or the other unreliable. See [Testing](08c-concepts-testing.md).
- **Maintainability**: an ADR for every significant technical choice, and generated docs/coverage published to GitHub Pages on every successful deployment, so the *why* behind a decision and the current *state* of the code are both one click away.
- **Internationalisation**: full EN/DE coverage enforced by keeping every visible string in i18next locale JSON — no hardcoded UI text. See [i18n & Theming](08b-concepts-i18n-theming.md).

## References

- [01-introduction-and-goals.md](01-introduction-and-goals.md) — tech stack table and component diagram
- [Architecture Decisions](09-decisions/index.md) — full ADR index
- [Quality Requirements](10-quality-requirements.md) — the quality goals these strategies serve
