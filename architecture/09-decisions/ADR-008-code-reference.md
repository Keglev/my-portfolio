# ADR-008: Keep the Generated Reference, Renamed "Code Reference"

[← Decisions index](index.md)

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Consequences](#consequences)
- [References](#references)

## Status

Superseded by [ADR-009](ADR-009-retire-code-reference.md) (2026-07-22), which
retired the published site outright rather than keeping it under a better
name. The decision below was made and executed as written; the follow-up
note is here rather than in the body because the reasoning that led to
"keep, renamed" is exactly what ADR-009 had to answer, and rewriting it
would leave that answer arguing with nothing.

Accepted (2026-07-22).

Records a decision that [ADR-004](ADR-004-three-workflow-cicd.md) assumed
rather than made: what the workflow it introduced actually publishes, and
what that published site is called. ADR-004's own decision — the workflow
topology — is unaffected and remains Accepted.

## Context

`api-docs.yml` generates an HTML reference from the JSDoc comments in `src/`
and publishes it to `gh-pages` under `/jsdoc/`. Both the workflow and the
landing card called it "API Docs".

That name was wrong in a way that mattered. This application exposes no API.
It fetches nothing at runtime, serves no endpoints, and has no consumers to
write an API contract for. A reader who follows a card labelled "API Docs"
expects endpoints and request/response schemas, and finds a module listing.
The name described the generator (JSDoc, whose output is conventionally
called an API reference) rather than the content.

That left a keep-or-drop question, since a mis-named site is a candidate for
deletion as easily as for renaming:

- **Drop it.** `api-docs.yml` becomes coverage-only, one npm script and one
  devDependency disappear, and the permanent `linkify-it` audit finding that
  arrives through `jsdoc` → `markdown-it` disappears with them.
- **Keep as is.** No work, and the wrong name stays.
- **Keep, renamed.** The site is retained for what it demonstrably is: a
  generated, always-current reference over every module, produced by the same
  pipeline that runs the tests.

## Decision

**Keep it, renamed "Code Reference"**, conditional on the cleanup below
landing in the same change — the rename was approved only as part of a
package, not as a label swap.

1. The name changes at every surface a reader or maintainer meets: the
   workflow name (`Docs — Code Reference and coverage`), its dispatch input
   (`apiDocs` → `codeRef`, and the same rename in
   `scripts/ci/detectPipelineScope.js`, `runPipelineScope.js`, `ci.yml`, and
   their tests), the landing card in both languages, the documentation index
   in both languages, the pipeline chapter, and the glossary.
2. The 55 committed files under `docs/jsdoc/` are deleted from git and the
   directory is gitignored. They were a stale snapshot of generated output —
   the tree they described no longer existed after the Vite and Vitest
   migrations.
3. That deletion is what lets `architecture-docs.yml` drop the `jsdoc` half
   of its rsync exclude. The exclude existed for exactly one reason: those
   committed files would otherwise have overwritten the freshly generated
   `gh-pages/jsdoc/` with an older copy. With nothing committed, there is
   nothing to exclude.
4. The generator's own output is narrowed to `src/` minus `src/__tests__/`.
   A reference whose module list is half test files is not a reference.

What deliberately does **not** change: JSDoc remains the generator, `jsdoc.json`
remains the config filename, and `/jsdoc/` remains the published URL path.
The rename is of the site, not of the tool or the address — moving the URL
would break every existing link for no reader benefit.

## Consequences

- **`jsdoc` stays a devDependency, and so does its audit finding.**
  `linkify-it` (high, DoS via the `mailto:` validator) reaches the tree
  through `jsdoc` → `markdown-it` and has no fix available. It is dev-only —
  nothing from this chain enters the browser bundle. It is waived in
  `scripts/audit-check.js`'s allowlist with that reasoning recorded at the
  entry, so a *new* high still fails the check.
- **The allowlist covers two findings, not one.** The second, `brace-expansion`,
  arrives through `eslint-plugin-jsx-a11y` and
  `eslint-plugin-testing-library` — the ESLint 9 toolchain that
  [ADR-007](ADR-007-vite-migration.md) introduced, not through JSDoc. Both
  are dev-only denial-of-service classes in build tooling that only ever
  processes this repository's own files.
- **A waiver that stops matching is reported.** `audit-check.js` prints stale
  allowlist entries rather than silently carrying them, so a waiver outlives
  its finding by at most one run.
- **The reference is no longer readable from a git checkout.** It has to be
  generated (`npm run docs:jsdoc`) or read on the published site. That is the
  point: a committed copy is a copy that is wrong between regenerations.

## References

- [ADR-004: Three-Workflow CI/CD Architecture](ADR-004-three-workflow-cicd.md)
- [ADR-007: Vite as the Build Tool](ADR-007-vite-migration.md)
- [Deployment & CI/CD pipeline](../07-deployment.md)
- [Build tooling reference](../08d-concepts-build-tooling.md)
- `.github/workflows/api-docs.yml`, `scripts/audit-check.js`, `jsdoc.json`
