# Deployment notes — Vercel and build-time fetch

This project optionally fetches GitHub pinned repositories and README assets at build time. The fetch script writes static artifacts into `public/projects.json` and `public/projects_media/<repo>/` which the client uses at runtime.

Why build-time fetch?
- Keeps your GitHub token out of the browser (the token is only used on the build host).
- Produces deterministic static artifacts so the client can render without runtime GraphQL requests.

Required environment variables (set in Vercel dashboard → Project → Settings → Environment Variables):

- `GH_PROJECTS_TOKEN` — a GitHub personal access token. For public repositories `public_repo` scope is sufficient. For private repositories you need `repo` scope. Set this for the Production & Preview environments and target it for Build.
- `DEEPL_API_KEY` — optional. If set, the build script will attempt to translate summaries/docs titles to German via DeepL.

Optional:
- `DEBUG_FETCH` — when set to `1` or `true` the fetch script will emit extra debug logs during build. Do not enable in production by default.

Running locally

Create a `.env.local` file (gitignored by CRA) with:

```
GH_PROJECTS_TOKEN=your_github_pat_here
DEEPL_API_KEY=optional_deepl_key
```

Then run:

```
npm run prebuild
npm run build
```

How the build step is wired

- `package.json` contains a `prebuild` script that runs `node ./scripts/fetchProjects.js`.
- Vercel runs `prebuild` automatically before `build`, so your static artifacts will be generated during deployment.

Fail-fast vs fail-soft

- The `prebuild` script is configured to run and fail the build if it errors. This is the recommended mode for correctness: you want to know promptly if the build-time fetch didn't run and artifacts are missing.
- If you prefer deployments to continue even when the fetch fails (for example to preserve availability if GitHub has a transient outage), modify `prebuild` to swallow errors (e.g., `node ./scripts/fetchProjects.js || echo 'fetch failed'`).

Security

- Keep the PAT scoped minimally and rotate regularly.
- Do not commit tokens to source control. Use Vercel environment variables instead.

Troubleshooting

- If builds fail with GraphQL errors, ensure `GH_PROJECTS_TOKEN` is valid and has the required scopes.
- For more details enable `DEBUG_FETCH` for a single preview deploy to inspect the build logs (remove or disable it after debugging).
