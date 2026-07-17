# ADR-005: Vercel as the Hosting Platform

[← Decisions index](index.md)

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Consequences](#consequences)
- [References](#references)

## Status

Accepted. Note: `build-and-fetch.yml`, named below, was renamed `deploy.yml`
in the workflow rework described in [ADR-004's Update](ADR-004-three-workflow-cicd.md#update-2026-07-17);
the prebuilt-artifact deployment mechanism itself is unchanged.

## Context

The portfolio is a React SPA built with Create React App. It requires HTTPS,
fast global CDN delivery, and a reliable deployment target for a low-traffic
personal project. Self-hosting was not considered due to cost and ongoing
maintenance overhead.

Two deployment strategies were evaluated:

1. **Standard Vercel GitHub integration** — Vercel pulls the source code and
   runs its own build. This would duplicate the CRA build that already runs in
   GitHub Actions and gives up the tight control over the build environment
   that running the build in CI provides.

2. **Prebuilt artifact deployment** — GitHub Actions builds the app and
   assembles a Vercel Build Output API v3 artifact, then deploys the
   pre-assembled output with `vercel --prebuilt`. Vercel receives a finished
   artifact with no rebuild step.

Option 2 was chosen because it keeps the full build pipeline — including the
GitHub GraphQL fetch and DeepL translation — inside GitHub Actions where the
secrets are already managed.

## Decision

Deploy the React app to Vercel using **prebuilt artifact deployment** (Vercel
Build Output API v3). The `build-and-fetch.yml` workflow assembles the artifact
in `.vercel/output/static/` via `scripts/prepareVercelOutput.sh` and deploys it
with `vercel --prod --prebuilt`. Vercel performs no build step; it serves the
static output directly from its edge CDN.

Production deploys trigger only from the `main` branch via the
`build-and-fetch.yml` workflow (after `ci.yml` passes). Vercel environment
variables (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are stored as
GitHub Actions secrets.

A `vercel.json` in the project root sets `github.productionBranch` to `"main"`
and `buildCommand` to `"react-scripts build"`. The `productionBranch` setting
prevents the `gh-pages` branch (which receives the documentation site) from
being treated as a Vercel production source. The `buildCommand` value is defined
for completeness but is never exercised — the `--prebuilt` flag means Vercel
receives a finished static artifact and skips any build step of its own.

## Consequences

- Zero redundant builds: the artifact built and smoke-tested in CI is
  exactly what is served in production
- Deploy secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) never leave GitHub Actions
- Vercel's global edge CDN serves the SPA with automatic HTTPS and HTTP/2
- The `.vercel/output/config.json` routes all unmatched paths to `index.html`
  so client-side React Router navigation works without server configuration
- No preview deployments per branch (the standard GitHub integration would
  provide these automatically; the prebuilt approach requires explicit
  workflow steps to create them)
- Vendor dependency on the Vercel Build Output API v3 format; a major version
  change would require updating `prepareVercelOutput.sh`
- The free tier is sufficient for a portfolio with low traffic

## References

- [Vercel Build Output API v3 documentation](https://vercel.com/docs/build-output-api/v3)
- [Vercel CLI documentation](https://vercel.com/docs/cli)
- [DEPLOY.md](../../DEPLOY.md) — environment variables and deployment details
- [ci-cd-pipeline.md](../ci-cd-pipeline.md) — where the deploy step sits in the pipeline
- `scripts/prepareVercelOutput.sh` — assembles the prebuilt artifact
