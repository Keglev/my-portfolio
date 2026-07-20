#!/usr/bin/env bash
# File: prepareVercelOutput.sh
# Module: scripts/prepareVercelOutput
# Summary: Assembles the Vercel Build Output API v3 directory structure
#   from the React production build.
# Enterprise: Must run after `npm run build` and before `vercel --prebuilt`
#   (see deploy.yml) -- this script has no meaning without a fresh build/
#   directory already on disk.
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
cp -r build/* .vercel/output/static/ || true

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
