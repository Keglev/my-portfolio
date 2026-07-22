#!/usr/bin/env bash
# File: prepareVercelOutput.sh
# Module: scripts/prepareVercelOutput
# Summary: Assembles the Vercel Build Output API v3 directory structure
#   from the React production build.
# Enterprise: Must run after `npm run build` and before `vercel --prebuilt`
#   (see deploy.yml) -- this script has no meaning without a fresh dist/
#   directory already on disk. The source directory is dist/ (Vite's
#   default output) since the migration off Create React App, which
#   produced build/.
#
# Output layout:
#   .vercel/output/static/   -- compiled React app
#   .vercel/output/functions/ -- empty placeholder required by Vercel's spec
#   .vercel/output/config.json -- routing rules for client-side navigation
#   .vercel/output/.vc-config.json -- empty placeholder required by spec validation
set -e

# Idempotent reset -- output dir may already exist from a previous attempt.
rm -rf .vercel/output || true
mkdir -p .vercel/output/static

# Fail loudly on a missing build. The previous `|| true` silently produced an
# empty static/ directory, which the deploy.yml verify step then caught one
# step later with a less obvious error.
if [ ! -d dist ]; then
  echo "ERROR: dist/ not found -- run 'npm run build' before this script." >&2
  exit 1
fi
cp -r dist/* .vercel/output/static/

# Empty placeholder required by Vercel's output spec even for static-only projects.
mkdir -p .vercel/output/functions || true

# Vercel Build Output API v3 routing config.
# "handle": "filesystem" serves real static files first; the catch-all
# routes all other paths to index.html to support client-side routing.
printf '%s\n' '{' \
  '  "version": 3,' \
  '  "routes": [' \
  '    { "handle": "filesystem" },' \
  '    { "src": "\\/(.*)", "dest": "/index.html" }' \
  '  ]' \
  '}' > .vercel/output/config.json

# Empty placeholder required by Vercel's output spec validation.
echo '{}' > .vercel/output/.vc-config.json || true
