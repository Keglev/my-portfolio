#!/usr/bin/env bash
set -e

# Idempotent reset — output dir may already exist from a previous attempt.
rm -rf .vercel/output || true
mkdir -p .vercel/output/static
cp -r build/* .vercel/output/static/ || true
cp -f public/projects.json .vercel/output/static/projects.json || true
# projects_media may not exist in every build; || true prevents a missing-dir failure.
cp -r public/projects_media .vercel/output/static/projects_media || true

# Vercel Output API requires a functions dir even when the project has none.
mkdir -p .vercel/output/functions || true

# Vercel Build Output API v3 config.
# "handle": "filesystem" serves real static files first; the catch-all
# routes every other path to index.html to support client-side routing.
printf '%s\n' '{' \
  '  "version": 3,' \
  '  "routes": [' \
  '    { "handle": "filesystem" },' \
  '    { "src": "\\/(.*)", "dest": "/index.html" }' \
  '  ]' \
  '}' > .vercel/output/config.json

# Empty placeholder required by Vercel's output spec validation.
echo '{}' > .vercel/output/.vc-config.json || true
