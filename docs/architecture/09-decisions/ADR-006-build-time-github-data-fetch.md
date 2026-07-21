# ADR-006: Build-Time GitHub Data Fetch over Runtime API Calls

[← Decisions index](index.md)

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Consequences](#consequences)
- [References](#references)

## Status

Superseded — the build-time fetch pipeline described below was retired.
The Projects section now renders exclusively from the static, hand-curated
`src/data/projects.config.js`; no runtime or build-time GitHub fetch remains.
This ADR is kept as a historical record of why build-time fetch was
originally chosen over a runtime API call.

## Context

The portfolio needs to display project information — repository names,
descriptions, technology tags, README-derived documentation links — that
changes as projects evolve. Two approaches were evaluated:

1. **Runtime fetch** — the React app calls the GitHub API in the browser on
   each page load. Simple to implement, but exposes the site to GitHub's
   unauthenticated rate limit (60 requests/hour per IP), requires the browser
   to wait for the API response before rendering the Projects section, and
   requires a public API token or a proxy to avoid rate limiting.

2. **Build-time fetch** — a Node.js script fetches the data during CI/CD and
   writes it to a static JSON file that is bundled into the Vercel deployment.
   The browser fetches a local static asset, not an external API.

The portfolio also needed translated German descriptions for the German-language
view. Translating descriptions on every page load via DeepL would add latency
and consume DeepL API quota continuously. At build time, translations can be
cached per repository and only re-requested when the English source text
changes.

## Decision

Fetch all project data from the GitHub GraphQL API at **build time** inside
the `build-and-fetch.yml` GitHub Actions workflow, via
`scripts/fetchProjects.js`. The script:

1. Queries the GitHub GraphQL API for the owner's pinned repositories (up to 12)
   using a `GH_PROJECTS_TOKEN` secret
2. Extracts repository metadata: name, description, URL, primary language,
   topics, and README-derived documentation links
3. Translates English descriptions to German via the DeepL free-tier API,
   using a per-repository md5-keyed cache in
   `public/projects_media/{repo}/meta.json`
4. Writes the complete dataset to `public/projects.json`
5. Downloads repository cover images into `public/projects_media/`

`public/projects.json` is bundled as a Vercel static asset. At runtime, the
`useProjects` hook fetches it with a single `GET /projects.json` request to
the same CDN origin that serves the app.

Fallback and post-processing scripts (`applyFallbackDocScan.js`,
`postprocessProjects.js`, `verifyProjects.js`) run after the fetch to ensure
the output is complete and schema-valid before the React build proceeds.

## Consequences

- No GitHub API calls in the browser; no rate-limit exposure to end users
- The Projects section renders immediately from a CDN-cached static asset
- A `GH_PROJECTS_TOKEN` with `read:user` scope is required only in CI
- Project data reflects the state at the time of the last deployment;
  changes to pinned repositories are not visible until the next build
- The build step fails if the GitHub API is unreachable or the token has
  expired, preventing a deployment with stale or empty project data
- DeepL quota is consumed only when descriptions change, not on every page view
- Adding a new pinned repository on GitHub automatically appears in the
  portfolio on the next successful build without any code change

## References

- [GitHub GraphQL API documentation](https://docs.github.com/en/graphql)
- [DeepL API documentation](https://www.deepl.com/docs-api)
- [data-flow.md](../06-runtime.md) — how project data flows into the React component tree today
- `scripts/fetchProjects.js` — entry point for the build-time fetch
- `scripts/lib/graphql/pinnedGraphql.js` — GraphQL query definition
- `scripts/lib/translation/translate.js` — DeepL integration and cache logic
