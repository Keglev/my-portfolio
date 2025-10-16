# How to refresh the portfolio site (README / docs updates)

This document explains how to regenerate the prebuilt `projects.json` and redeploy the site after you change a README.md or docs in one of your project repositories. It includes quick local commands, how to re-run the GitHub Action, and recommendations for separating code vs docs pipelines (simple and enterprise-grade).

## Quick local refresh (PowerShell)

1. Open PowerShell at the repository root (`my-portfolio`).
2. (Optional) set DeepL secret for translation in this session only:

```powershell
# $env:DEEPL_SECRET = 'your_deepl_secret_here'   # do NOT commit this
# $env:DEEPL_API_KEY = 'your_deepl_key_here'     # alternative name supported
```

3. Run the same steps used by CI to fetch, postprocess and build:

```powershell
node .\scripts\fetchProjects.js
node .\scripts\postprocessProjects.js
node .\scripts\applyFallbackDocScan.js   # optional
npm run build
```

4. Prepare the Vercel prebuilt output (optional — only if you deploy with `vercel --prebuilt`):

```powershell
Remove-Item -Recurse -Force .vercel\output -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force .vercel\output\static | Out-Null
Copy-Item -Path build\* -Destination .vercel\output\static -Recurse -Force
Copy-Item -Path public\projects.json -Destination .vercel\output\static\projects.json -Force
Copy-Item -Path public\projects_media -Destination .vercel\output\static\projects_media -Recurse -Force

@"
{
  "version": 3,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
"@ | Out-File -FilePath .vercel\output\config.json -Encoding utf8
```

5. Deploy with Vercel (optional):

```powershell
# if you have Vercel CLI and token in $env:VERCEL_TOKEN
npx vercel --prebuilt . --token $env:VERCEL_TOKEN --yes
```

6. Verify the result (example):

```powershell
Invoke-RestMethod 'https://your-domain.example.com/projects.json' | Select-Object -First 1
```

Notes:
- Never commit your secret; setting it in the environment is safe for local runs.
- `fetchProjects.js` will only call DeepL when a relevant env var is present (`DEEPL_API_KEY` or `DEEPL_SECRET` — both are supported).

## Re-run via GitHub Actions (recommended for regular use)

- Go to GitHub → Actions → "Build and Fetch Projects" (or the workflow name you use) → Run workflow.
- Or use `gh` (GitHub CLI):

```bash
gh workflow run build-and-fetch.yml --repo Keglev/my-portfolio --ref main
```

If `DEEPL_SECRET` (or `DEEPL_API_KEY`) is set in repository secrets, the Action will run translations during fetch. The workflow will create the `.vercel/output` prebuilt artifact and deploy it with `vercel --prebuilt`.

---

## Triggering only code or only docs: simple approaches

If you want to treat documentation updates separately from code updates, you have two practical options:

1) Path-filtered workflows (single repo, easy)

- Create two separate workflows in `.github/workflows/`:
  - `build-and-fetch.yml` — run when code files change (e.g. `src/**`, `package.json`, `public/**`).
  - `docs-refresh.yml` — run when docs/README content changes (e.g. `README.md`, `projects/**`, `docs/**`, or pattern matching `**/README.md`).

Example `docs-refresh.yml` trigger (only runs when README or docs change):

```yaml
name: Docs refresh
on:
  push:
    branches: [ main ]
    paths:
      - '**/README.md'
      - 'projects/**'
      - 'docs/**'
  workflow_dispatch:

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install
        run: npm ci --legacy-peer-deps
      - name: Fetch & postprocess
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GH_PROJECTS_TOKEN: ${{ secrets.GH_PROJECTS_TOKEN }}
          DEEPL_SECRET: ${{ secrets.DEEPL_SECRET }}
        run: |
          node scripts/fetchProjects.js
          node scripts/postprocessProjects.js
          node scripts/applyFallbackDocScan.js
      - name: Build & prepare prebuilt
        run: |
          npm run build
          # copy into .vercel/output as in main workflow
```

This keeps code-triggered builds separate from docs-triggered builds.

2) Separate repo for docs (recommended if docs team/process is independent)

- Move docs into a separate repository (or keep them in each project repo but use a dedicated docs repo as the canonical source). Then use webhooks or `repository_dispatch` events to trigger the portfolio repo's docs workflow. This decouples permissions and allows different reviewers, CI quotas, and schedules.

---

## Enterprise solution and best practices

If you manage multiple repos and want robust, scalable, auditable builds for code vs docs, consider the following:

1) Separate pipelines (recommended):

- Code pipeline: triggers on changes to application code and performs a full build and deployment. Use path filters to scope triggers.
- Docs pipeline: triggers on docs/README changes (either in the same repo or other repos) and produces a smaller artifact (docs manifest) which is then deployed separately.

Advantages:
- Reduced build time and cost (docs builds can be lighter and run more often).
- Clear ownership and lower blast radius (docs deploys don't change app code).
- Simpler approvals: different deployment gates for docs vs code.

2) Use a build artifact store and deploy hooks:

- Produce deterministic artifacts in CI (e.g., upload `projects.json` and `projects_media` to an artifact store or S3). The code pipeline can reference these artifacts during application builds.
- Use Vercel deploy hooks (or the Vercel API) to trigger a deploy when artifacts change. This allows pushing only the changed static assets without running a full app build.

3) Triggering across repositories:

- Use `repository_dispatch` or a dedicated CI user with a PAT to call the portfolio repo's workflow when docs change in other repos.
- Or use an integration/service (e.g., Jenkins, GitHub Apps) to orchestrate cross-repo events and maintain audit logs.

4) Security and secret handling:

- Store secrets in the CI provider's secret store (GitHub Actions secrets or Vercel envs). Avoid printing secrets in logs.
- Limit which workflows can access which secrets using `permissions` and environment protections.

5) Observability and approvals:

- Add a short verification step (already present) to print the number of repos and docs links before deploy.
- For enterprise, add required approvals or environment protection for production deploys (GitHub Environments) and Slack/Teams notifications on deploys.

6) Caching & incremental builds:

- Use content-hash based caching (persist and compare `meta.json` per project; your scripts already write `projects_media/*/meta.json`) to skip expensive downloads or translations.

---

## Minimal recommended setup for you

Given your setup and needs, my recommended minimal posture:

1. Keep the current repo and workflows.
2. Add one small `docs-refresh.yml` workflow that triggers on changes to `**/README.md` and `docs/**` (example above). This will regenerate `projects.json` and run a prebuilt Vercel deploy without touching the code-triggered workflow.
3. Add `DEEPL_SECRET` as a GitHub Actions secret if you want translations during docs runs.

This gives you separate, predictable docs redeploys while leaving code builds unaffected.

---

If you'd like, I can:

- Create `docs/REFRESH.md` in the repo (this file),
- Add the `docs-refresh.yml` workflow for you (path-filtered), or
- Implement a `repository_dispatch` example to trigger the docs pipeline from other repos.

Tell me which of those you'd like me to add next and I'll make the change and run a quick local build to validate.
