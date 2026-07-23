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
        '__mocks__/**',
        'config/vitest/**',
        // Standalone operator script, run by hand, not part of the app.
        'scripts/audit-check.js',
        // Translation catalogues are DATA, not code. istanbul was reporting
        // them as 100%-covered files, which inflated the file count and
        // implied a test had somehow asserted a JSON literal.
        '**/*.json',
        // Same reasoning, same conclusion, different file extension: these
        // two are exported array literals of hand-written content -- project
        // copy and skill labels -- that happen to live in .js because they
        // reference i18n keys. Measuring them produced a 0% row on the
        // published report that read as untested code, and the only test
        // that would have moved it is an assertion on their length or
        // contents: filler that breaks whenever the copy is edited.
        //
        // Note which sibling is NOT here. cvAssets.config.js also sits in
        // src/data/, but getCvFile() is a real function with a real branch
        // (regional codes like 'de-DE' must resolve to the German PDF), and
        // that branch was an actual bug once. It is code, it stays measured
        // at the 85% standard.
        'src/data/projects.config.js',
        'src/data/skills.config.js',
      ],

      // lcov feeds the CI artifact that coverage.yml republishes;
      // json-summary drives badge generation; text is the terminal table.
      reporter: ['html', 'text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',

      thresholds: {
        // perFile, NOT aggregate. An aggregate percentage lets a
        // well-covered module mask an untested one: adding a fully covered
        // file raises the project total even though the untested file is
        // exactly as untested as before. Per-file means every module has to
        // carry its own weight.
        perFile: true,

        // NO top-level statements/branches/functions/lines here, deliberately.
        // Vitest applies top-level thresholds to EVERY file even when a glob
        // entry also matches it ("Global threshold is for all files, even if
        // they are included by glob patterns" -- see its checkThresholds
        // implementation). A global 85 would therefore make the documented
        // exceptions below unreachable: they would be reported twice, pass
        // their own entry, and still fail the global one.
        //
        // Instead every path is covered by exactly one glob group below, and
        // the groups partition the measured tree. A file matching no group is
        // ungated -- so a new top-level directory needs an entry adding here.
        // BUCKET: partition-completeness meta-test for coverage globs (CB-P10-01)
        //
        // The `!(name)` extglobs are what keep the partition disjoint: a file
        // matching two groups is checked against BOTH, so an exception must be
        // carved out of its neighbours' pattern rather than merely listed
        // afterwards.

        // ---------------------------------------------------------------
        // The project standard: 85% on every metric, every file.
        // ---------------------------------------------------------------
        '**/src/**/*.jsx': {
          statements: 85, branches: 85, functions: 85, lines: 85,
        },
        '**/src/components/**/*.js': {
          statements: 85, branches: 85, functions: 85, lines: 85,
        },
        '**/src/{i18n,styles}/**/*.js': {
          statements: 85, branches: 85, functions: 85, lines: 85,
        },
        // No carve-out needed: the two data configs that used to require one
        // are excluded from collection entirely, so cvAssets.config.js is the
        // only file this group matches.
        '**/src/data/*.js': {
          statements: 85, branches: 85, functions: 85, lines: 85,
        },
        // Carve-out: detectPipelineScope.js has its own entry further down.
        '**/scripts/ci/!(detectPipelineScope).js': {
          statements: 85, branches: 85, functions: 85, lines: 85,
        },
        // Carve-out: markedConfig.js has its own entry further down.
        '**/scripts/docs/lib/!(markedConfig).js': {
          statements: 85, branches: 85, functions: 85, lines: 85,
        },

        // ---------------------------------------------------------------
        // Documented exceptions.
        //
        // Each entry below is a module where 85% is only reachable through
        // filler assertions or a change that would make the test suite worse
        // than the gap it closes. Numbers are set at, or just under, the
        // measured value -- they are regression guards, not aspirations, so
        // a DROP still fails the build.
        //
        // Adding an entry here requires the same justification these carry:
        // name the specific uncovered mechanism, and say what covering it
        // would cost.
        // ---------------------------------------------------------------

        // Uncovered: renderDiagram() and run()'s main rendering loop. Both
        // require a real mmdc binary to execute. Covering them means either
        // adding @mermaid-js/mermaid-cli -- which drags in Chromium -- as a
        // devDependency, or asserting against a mock of the very subprocess
        // call under test, which proves nothing. The path that CI actually
        // takes every run (mmdc absent -> clean no-op exit) IS covered.
        '**/scripts/docs/build_mermaid.js': {
          statements: 65, branches: 45, functions: 90, lines: 65,
        },

        // Uncovered: the two load-time process.exit fail-fast paths (marked
        // not installed / no resolvable parse function) and the
        // library-version resolution ternaries. All execute at import, before
        // any export exists, and resolve through a CommonJS require that
        // vi.mock cannot intercept.
        '**/scripts/docs/lib/markedConfig.js': {
          statements: 80, branches: 45, functions: 90, lines: 80,
        },

        // Branch gap only (statements/functions/lines are all >= 97). The
        // uncovered branches are CLI default-param bindings --
        // docsDir/tmplDir/cssDir default to the real docs/ tree, and
        // concatCss's `read` defaults to fs. Exercising them requires letting
        // a test write to the real, tracked docs/ tree, which is a worse
        // violation than the uncovered branches are.
        '**/scripts/docs/build_docs.js': {
          statements: 95, branches: 50, functions: 90, lines: 95,
        },

        // Branch gap only, and only since the codeRef flag was removed
        // (ADR-009). The one uncovered branch is the `require.main === module`
        // CLI guard, which cannot be covered in-process: taking it means
        // running the file as a child process, and istanbul does not
        // instrument one. It was under the 85% group until this file shrank
        // from ~12 branches to 6, at which point the same single unreachable
        // branch went from 8% of the total to 17%. Nothing became less
        // tested -- the denominator moved. Every other metric is >= 96.
        '**/scripts/ci/detectPipelineScope.js': {
          statements: 96, branches: 83, functions: 100, lines: 95,
        },

        // projects.config.js used to hold a 0/0/0/0 entry here, on the
        // reasoning that keeping it measured kept it visible. That was the
        // wrong trade: what it made visible on the published report was a 0%
        // row that reads as untested code. It is excluded from collection
        // now, alongside skills.config.js -- see the exclude list above.
      },
    },
  },
});
