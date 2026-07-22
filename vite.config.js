/**
 * @file vite.config.js
 * @module vite.config
 * @summary Vite build AND Vitest test configuration for the portfolio SPA.
 * @enterprise Replaces react-scripts (CRA), which was deprecated in
 * February 2025 and pulls an unmaintained transitive tree -- see
 * docs/architecture/09-decisions/ADR-007-vite-migration.md for the full
 * decision record and the npm-audit delta.
 *
 * Every option below is set deliberately; Vite's defaults are otherwise
 * left alone on purpose, so anything present here is a decision, not
 * boilerplate.
 */
// 'vitest/config', not 'vite': same defineConfig plus the `test` key below.
// Build and tests share ONE config on purpose -- the transform that runs the
// tests is then provably the same transform that builds the app, which is the
// whole reason for consolidating on Vitest (see ADR-008).
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // JSX transform + Fast Refresh. The automatic runtime is the default, so no
  // `import React` statement is required in either the app or the tests.
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

  test: {
    // Jest-compatible globals (describe/it/expect/vi/beforeEach...) without a
    // per-file import. Kept deliberately: it preserves the existing test
    // dialect exactly, so this migration is a runner swap rather than a
    // rewrite of 80+ tests. It also enables React Testing Library's automatic
    // cleanup between tests, which relies on a global afterEach.
    globals: true,

    // React component tests need DOM APIs; the Node default has none.
    environment: 'jsdom',

    // jest-dom matchers (toBeInTheDocument, toHaveTextContent...). The
    // /vitest entry point registers them against Vitest's expect rather than
    // Jest's. This is the whole setup file -- see config/vitest/setup.js for
    // what it deliberately no longer does.
    setupFiles: ['./config/vitest/setup.js'],

    alias: {
      // The Vercel analytics SDK has no meaning in a test environment and
      // would otherwise try to initialise real telemetry. Vite handles CSS
      // and static assets natively, so the CRA-era style/file mocks that used
      // to sit beside this one are gone.
      '@vercel/speed-insights/react': new URL(
        './config/vitest/speedInsightsMock.js',
        import.meta.url,
      ).pathname,
    },

    coverage: {
      // istanbul, NOT the v8 default. v8 and istanbul disagree on branch
      // percentages for identical code, and the approved coverage plan was
      // baselined under istanbul via Jest. Pinning it keeps the before/after
      // numbers comparable across the runner swap; evaluating v8 is a
      // separate, deliberate decision.
      provider: 'istanbul',

      // Same set the Jest config collected, so coverage scope does not
      // silently change along with the runner.
      include: ['src/**/*.{js,jsx}', 'scripts/**/*.js', 'config/**/*.js'],

      exclude: [
        // Tests and fixtures never count toward their own coverage.
        'src/__tests__/**',
        'src/__mocks__/**',
        'config/vitest/**',
        // Standalone operator script, run by hand, not part of the app.
        'scripts/audit-check.js',
      ],

      // lcov feeds the CI artifact that api-docs.yml republishes;
      // json-summary drives badge generation; text is the terminal table.
      reporter: ['html', 'text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
    },
  },
});
