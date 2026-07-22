# ADR-009: Retire the Published Code Reference

[← Decisions index](index.md)

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Consequences](#consequences)
- [References](#references)

## Status

Accepted (2026-07-22).

Supersedes [ADR-008](ADR-008-code-reference.md), which kept the same site
under a corrected name. ADR-008's body is left as written — it records the
reasoning this decision had to answer.

Also updates the topology recorded in
[ADR-004](ADR-004-three-workflow-cicd.md): the workflow that published the
site is now `coverage.yml` and publishes only the coverage report. ADR-004's
four-workflow decision is unaffected; one of the four does less than it did.

## Context

ADR-008 asked whether the generated reference was worth keeping and answered
"yes, under an honest name". Renaming it made the question sharper rather
than settling it: once the site was called a *code reference* instead of *API
docs*, what it actually offers a reader became the whole of its value.

For a **library**, that value is clear — the generated site is the contract
between the code and people who cannot read it, because they only ever see
the published package. For an **application**, the audience is a reviewer or
a maintainer, and both have the source in front of them. Everything the site
showed — module list, signatures, the JSDoc prose itself — reads better in
the file, next to the code it describes, with the surrounding context that a
generated page necessarily strips away.

What the site cost was not nothing:

- a devDependency (`jsdoc`) with a transitive high-severity advisory that had
  no fix, waived permanently in `audit-check.js` — a standing exception whose
  only justification was this site
- a workflow branch, a scope flag (`codeRef`), and a published tree on
  `gh-pages` that had to be kept in step with the source
- a generator whose default output included every test file until it was
  narrowed by hand

## Decision

**Retire the published site.** The in-source JSDoc standards remain fully in
force — every module keeps its `@file`/`@module`/`@summary` header and its
documented functions. Only the published mirror is gone.

Removed: the `jsdoc` devDependency, `jsdoc.json`, the `docs:jsdoc` npm
script, the landing card in both languages, and the `codeRef` scope flag.
`api-docs.yml` becomes `coverage.yml` ("Docs — test coverage"), with its
concurrency group renamed `coverage-pipeline` to match, and it takes no
inputs — with one job left, dispatching it is the instruction. `ci.yml` still
decides whether to dispatch, from the `coverage` scope flag.

The `gh-pages` copy is deleted by a one-time direct commit to that branch,
not by a workflow step. The residue is a one-off consequence of this
decision, and a step whose only purpose is to run once either runs forever or
needs a second change to remove it.

## Consequences

- **The audit allowlist shrinks to one entry, by subtraction rather than by
  decision.** `linkify-it` reached the tree through `jsdoc` → `markdown-it`;
  uninstalling `jsdoc` took the finding with it. The waiver was not renewed,
  it stopped being necessary. `brace-expansion` remains, unrelated, from the
  ESLint toolchain (see [ADR-007](ADR-007-vite-migration.md)).
- **The scope logic gets simpler without losing a rule.** `codeRef` separated
  "the exported surface changed" from "only tests changed" because the first
  needed a rebuild and the second did not. Coverage never made that
  distinction — it was true for either — so the two collapse into one
  `src/**` check.
- **Links to `/jsdoc/` from outside this repository will break.** Nothing in
  the repo points there any more, but anything published elsewhere that did
  will 404 once the `gh-pages` copy is removed. Accepted: the alternative is
  serving a page whose content is a snapshot of a codebase that has moved on.
- **JSDoc coverage is no longer visible as a site.** It is visible where it
  matters — in the source, and in review. If a future consumer needs a
  published contract (a shared component package, say), this decision is the
  one to revisit, and ADR-008 records what the "keep" case looked like.

## References

- [ADR-008: Keep the Generated Reference, Renamed "Code Reference"](ADR-008-code-reference.md)
- [ADR-004: Three-Workflow CI/CD Architecture](ADR-004-three-workflow-cicd.md)
- [ADR-007: Vite as the Build Tool](ADR-007-vite-migration.md)
- [Deployment & CI/CD pipeline](../07-deployment.md)
- `.github/workflows/coverage.yml`, `scripts/audit-check.js`
