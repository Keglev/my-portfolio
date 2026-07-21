# Constraints

[← Architecture index](index.md)

Organizational and technical constraints that shaped the architecture, distinct from the *chosen* solutions covered in [Solution Strategy](04-solution-strategy.md) — these are the boundaries the solutions had to work within.

## Table of Contents

- [Organizational Constraints](#organizational-constraints)
- [Technical Constraints](#technical-constraints)
- [Conventions](#conventions)
- [References](#references)

## Organizational Constraints

| Constraint | Impact |
|------------|--------|
| Single maintainer | No code review gate beyond CI; documentation and ADRs substitute for the shared context a team would otherwise have |
| Personal portfolio, low traffic | Free-tier hosting (Vercel, GitHub Pages) is sufficient; no capacity planning or paid infrastructure needed |
| Target audience: German-speaking job market | Drove the default-locale decision (see [Conventions](#conventions) below) |

## Technical Constraints

| Constraint | Impact |
|------------|--------|
| No backend or database | Project data must be static and bundled at build time — see [ADR-006](09-decisions/ADR-006-build-time-github-data-fetch.md) for why an earlier runtime-fetch approach was retired in favor of this |
| Create React App, not ejected | Build configuration (Babel, Webpack) is fixed to CRA's defaults; anything requiring a custom build step needs a workaround rather than a config edit — see [ADR-001](09-decisions/ADR-001-react.md) |
| Static hosting only (Vercel + GitHub Pages) | No server-side rendering or API routes; deployment is a **prebuilt artifact** (Vercel Build Output API v3), not the standard Vercel build-from-source integration — see [ADR-005](09-decisions/ADR-005-vercel-hosting.md) |
| Two incompatible Jest environments | Node-only scripts (e.g. the docs build) and CRA component tests need separate Jest configs to avoid Babel/CSS transform conflicts — see [Testing](08c-concepts-testing.md) |

## Conventions

| Convention | Reason |
|------------|--------|
| Default locale `de` (German) | The portfolio targets a German-speaking job market — see [i18n & Theming](08b-concepts-i18n-theming.md) |
| ADRs for every significant technical choice | Single-maintainer projects lose decision context fastest; a short "why" document outlives its author's memory of the tradeoff |

## References

- [01-introduction-and-goals.md](01-introduction-and-goals.md) — tech stack and high-level architecture
- [ADR-005](09-decisions/ADR-005-vercel-hosting.md) — prebuilt-artifact deployment rationale
- [ADR-006](09-decisions/ADR-006-build-time-github-data-fetch.md) — static, build-time project data rationale
