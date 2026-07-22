# Glossary

[← Architecture index](index.md)

Terms and abbreviations used throughout these docs, in alphabetical order.

| Term | Meaning |
|------|---------|
| ADR | Architecture Decision Record — a short document capturing one significant technical choice, its context, and its consequences. See [chapter 09](09-decisions/index.md). |
| arc42 | A template for structuring software architecture documentation into 12 standard chapters, used for this documentation set. |
| Concurrency group | A GitHub Actions mechanism that serializes or cancels workflow runs sharing the same group name, used here to prevent `gh-pages` publishes from racing each other. See [Deployment](07-deployment.md). |
| CRA | Create React App — the zero-config build tooling this app was originally built with. Deprecated by the React team in February 2025 and replaced by Vite; the term survives only in historical records such as [ADR-001](09-decisions/ADR-001-react.md) and [ADR-007](09-decisions/ADR-007-vite-migration.md). |
| destination_dir / keep_files | Options of the `peaceiris/actions-gh-pages` GitHub Action controlling whether a publish is scoped to one subdirectory (`destination_dir`) and whether files outside the publish are preserved (`keep_files`). See [Deployment](07-deployment.md). |
| ErrorBoundary | A React class component that catches render errors in its subtree and shows a fallback UI instead of crashing the whole app; wraps the entire tree here. |
| gh-pages | The git branch GitHub Pages serves static content from — the deploy target for this documentation site and the coverage report. |
| i18next namespace | A named group of translation keys; this app uses a single `translation` namespace, so no prefix is needed when calling `t()`. See [i18n & Theming](08b-concepts-i18n-theming.md). |
| JSDoc | The documentation-comment convention used throughout `src/` and `scripts/`. A generated HTML site was published from these comments until [ADR-009](09-decisions/ADR-009-retire-code-reference.md) retired it; the comments themselves remain required — they are read in the source, which is where they were always most useful. |
| Mermaid | A text-based diagramming syntax rendered to SVG either at build time (`mmdc`) or client-side via CDN; used for every diagram in these docs. |
| Prebuilt artifact deployment | Deploying a fully built application to Vercel via `vercel --prebuilt`, skipping Vercel's own build step. See [ADR-005](09-decisions/ADR-005-vercel-hosting.md). |
| SPA | Single-page application — no server-side routing; all content lives in one document. See [Building Blocks](05-building-blocks.md). |
| Speed Insights | Vercel's zero-config Core Web Vitals tracking, used here for performance monitoring without cookies. |

*Additional terms will be added as later B3 chapters (03, 07, 08b) surface project-specific vocabulary not yet covered here.*
