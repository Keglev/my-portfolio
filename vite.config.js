/**
 * @file vite.config.js
 * @module vite.config
 * @summary Vite build configuration for the portfolio SPA.
 * @enterprise Replaces react-scripts (CRA), which was deprecated in
 * February 2025 and pulls an unmaintained transitive tree -- see
 * docs/architecture/09-decisions/ADR-007-vite-migration.md for the full
 * decision record and the npm-audit delta.
 *
 * Every option below is set deliberately; Vite's defaults are otherwise
 * left alone on purpose, so anything present here is a decision, not
 * boilerplate.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // JSX transform + Fast Refresh. The automatic runtime is the default, which
  // matches the `runtime: 'automatic'` already configured for babel in the
  // Jest transform -- so no `import React` statement is required in either
  // the app or the tests.
  plugins: [react()],

  // index.html lives at the repo root (Vite treats it as the build entry and
  // resolves /src/index.js from it), NOT in public/ as CRA required. public/
  // is now purely static passthrough -- see publicDir below.
  root: '.',

  // Static passthrough: the CV PDFs, project screenshots, and profile images
  // are referenced from src/ by root-absolute path ('/Carlos_..._CV_EN.pdf',
  // '/projects/*.png'). Vite copies publicDir contents to the build root
  // verbatim without hashing, which preserves exactly those paths. This is
  // Vite's default value, stated explicitly because those absolute paths
  // silently 404 if it is ever changed.
  publicDir: 'public',

  build: {
    // 'dist' is Vite's default and the directory vercel.json and
    // scripts/prepareVercelOutput.sh both expect. CRA used 'build/', which
    // is still listed in .gitignore for the same reason.
    outDir: 'dist',

    // Sourcemaps are published with the deployed bundle. This is a public
    // portfolio whose source is already on GitHub -- there is nothing to
    // conceal, and readable stack traces are worth more than the bytes.
    sourcemap: true,
  },

  server: {
    // CRA served on 3000; keeping the port avoids retraining fingers and
    // keeps any bookmarked localhost URL working.
    port: 3000,

    // Fail loudly instead of silently hopping to 3001 when the port is
    // taken -- a second dev server on an unexpected port is a confusing
    // way to lose half an hour.
    strictPort: true,
  },

  preview: {
    // `vite preview` serves the production build for the local smoke test
    // required by this migration's acceptance criteria. Distinct port so it
    // can run alongside the dev server.
    port: 4173,
    strictPort: true,
  },
});
