# Quality Requirements

[← Architecture index](index.md)

The quality tree and concrete scenarios behind this architecture's decisions. Where [Solution Strategy](04-solution-strategy.md) says *what* was chosen, this chapter says *what quality it was chosen for* and how to check it holds.

## Table of Contents

- [Quality Tree](#quality-tree)
- [Quality Scenarios](#quality-scenarios)
- [References](#references)

## Quality Tree

| Quality goal | Sub-aspects |
|---------------|-------------|
| Performance | No runtime API dependency; CDN-served static assets; Core Web Vitals monitored |
| Reliability | Render-error containment; CI gates every deploy on tests and lint |
| Internationalisation | Full EN/DE coverage; no hardcoded UI text |
| Accessibility | Semantic HTML; keyboard navigation; labeled icon-only controls |
| Maintainability | Decision history preserved (ADRs); generated docs stay current with the code |

## Quality Scenarios

Each scenario follows a stimulus → response format: something happens, and the architecture responds in a specific, checkable way.

### Performance

- **Scenario**: A visitor loads the live site. **Response**: Project data is read from static JSON bundled at build time — no GitHub API call happens in the browser, so the page has no external data dependency to wait on. Vercel Speed Insights records Core Web Vitals for every real visit, with no cookie consent required. See [ADR-006](09-decisions/ADR-006-build-time-github-data-fetch.md).

### Reliability

- **Scenario**: A component throws during render. **Response**: `ErrorBoundary`, wrapping the entire React tree, catches it and shows a fallback UI instead of a blank page.
- **Scenario**: A pull request has a failing test or lint error. **Response**: CI blocks the merge — no deploy can reach `main` with a known-broken build. See [Deployment](07-deployment.md).

### Internationalisation

- **Scenario**: A visitor switches language. **Response**: Every visible string re-renders in the selected locale — there are no hardcoded UI strings outside i18next's locale JSON files, so no partial-translation state is reachable. See [i18n & Theming](08b-concepts-i18n-theming.md).

### Accessibility

- **Scenario**: A keyboard-only visitor navigates the site. **Response**: All sections are reachable via the sidebar without a mouse, and icon-only buttons (theme toggle, social links) carry `aria-label`s so a screen reader announces their purpose.

### Maintainability

- **Scenario**: A future maintainer (possibly the current one, months later) needs to know why a technical choice was made. **Response**: The choice has an ADR under [chapter 09](09-decisions/index.md) recording its context and consequences, not just its outcome.
- **Scenario**: A change lands on `main`. **Response**: Generated API docs and, where in scope, the coverage report are republished to GitHub Pages automatically — the deployed docs never drift far from the code they describe.
- **Scenario**: A change lowers a module's test coverage. **Response**: CI fails. A minimum of **85% statements, branches, functions, and lines is enforced per file**, not as a project aggregate — an aggregate lets a well-covered module mask an untested one. A short, individually justified exception list is encoded in `vite.config.js`, where each entry names the specific uncovered mechanism and what covering it would cost. See [Testing](08c-concepts-testing.md).

## References

- [01-introduction-and-goals.md](01-introduction-and-goals.md) — where these quality goals were first identified
- [Testing](08c-concepts-testing.md) — how reliability and maintainability scenarios are actually checked
- [Risks and Technical Debt](11-risks-technical-debt.md) — known risks and deferred work tracked against this architecture
