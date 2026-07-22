/**
 * @file eslint.config.js
 * @module eslint.config
 * @summary ESLint 9 flat configuration, replacing the CRA `react-app` preset.
 * @enterprise eslint-config-react-app shipped inside react-scripts and died
 * with it. It was also pinned to ESLint 8, so removing CRA is what unblocks
 * ESLint 9 and flat config. Rule parity against the old preset is documented
 * per-block below -- see ADR-007 for the migration record.
 *
 * Flat config replaces .eslintrc.json AND the package.json "eslintConfig"
 * block, both of which were deleted; having had the same preset declared in
 * two places was itself a latent drift risk.
 */
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import testingLibrary from 'eslint-plugin-testing-library';

export default [
  {
    // Generated and vendored output. Flat config has no .eslintignore, so
    // ignores live here. docs/jsdoc and docs/coverage are generated HTML with
    // bundled scripts; dist/ and coverage/ are build artifacts.
    ignores: ['dist/**', 'build/**', 'coverage/**', 'docs/jsdoc/**', 'docs/coverage/**', 'node_modules/**'],
  },

  // Baseline correctness rules. react-app was itself built on top of
  // eslint:recommended, so this is the closest direct equivalent.
  js.configs.recommended,

  {
    // __mocks__ is included here (not only in the test block below) so it
    // inherits the JSX parser options -- the react-scroll mock renders JSX.
    files: ['src/**/*.{js,jsx}', '__mocks__/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals (window, document, fetch, localStorage...). react-app
        // supplied these via its env config; flat config requires them to be
        // declared explicitly.
        ...globals.browser,
      },
      parserOptions: {
        // Enables JSX parsing without a separate parser. The automatic runtime
        // means no `import React` is needed, matching vite.config.js and the
        // Jest babel transform.
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // --- Parity with react-app ---------------------------------------
      // Not optional despite the automatic JSX runtime: core no-unused-vars
      // has no concept of JSX, so without these every component imported and
      // then rendered as <Component /> is reported as an unused variable.
      // react-app enabled both for exactly this reason.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',

      // ESLint 9 changed the no-unused-vars default for caught errors from
      // 'none' to 'all', which newly flags this codebase's deliberate
      // `catch (e) { /* ignore */ }` guards. Pinned back to the ESLint 8
      // behaviour so this migration does not smuggle in a source-code change
      // disguised as a tooling change. Converting those guards to optional
      // catch binding (`catch {`) is a clean follow-up, not build work.
      'no-unused-vars': ['error', { caughtErrors: 'none' }],

      // react-app enabled rules-of-hooks as an error and exhaustive-deps as a
      // warning. Both are preserved at the same severity so this migration
      // does not silently change what fails the build.
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',

      // react-app included a subset of jsx-a11y as warnings. Kept (and kept at
      // warn) rather than dropped: accessibility regressions should stay
      // visible in a public-facing portfolio.
      ...jsxA11y.flatConfigs.recommended.rules,

      // --- Deliberately NOT carried over -------------------------------
      // react-app also bundled eslint-plugin-import and eslint-plugin-flowtype.
      // flowtype is dead (no Flow here), and import resolution is now Vite's
      // job -- a bad import fails the build loudly rather than needing a lint
      // rule. eslint-plugin-react is installed but only its two JSX-usage
      // rules are enabled (above); its remaining rules mostly police the
      // classic runtime this project does not use.

      // --- New, not present under react-app ----------------------------
      // Vite's Fast Refresh only updates a module cleanly when it exports
      // components and nothing else. CRA's refresh plugin tolerated mixed
      // exports and silently full-reloaded instead; this surfaces it.
      // allowConstantExport covers the `export const X = ...` constants that
      // sit alongside components in this codebase.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  {
    // Test and mock files. Replaces the `react-app/jest` half of the old
    // preset, which supplied the test globals. Without this block every
    // `describe`/`it`/`expect`/`vi` in the suite reports as no-undef.
    files: ['src/__tests__/**/*.{js,jsx}', '__mocks__/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        // Vitest runs with `globals: true`, and its global names are the Jest
        // ones -- describe/it/expect/beforeEach/afterEach/beforeAll/afterAll.
        // The `globals` package ships no vitest set, and reusing the jest set
        // is accurate rather than lazy: these are the same identifiers.
        ...globals.jest,
        // The one name Vitest does NOT share with Jest.
        vi: 'readonly',
        ...globals.node,
      },
    },
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      // react-app's jest half also bundled eslint-plugin-testing-library.
      // Kept: the component suite is entirely React Testing Library, and
      // existing `eslint-disable testing-library/*` directives in the tests
      // are only meaningful while the plugin is loaded.
      ...testingLibrary.configs['flat/react'].rules,

      // Fast Refresh has no meaning in a test file.
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    // Tests for scripts/ exercise Node modules and never touch React Testing
    // Library. The plugin's heuristics key on call-site NAMES, so any local
    // helper starting with "render" (renderHeading, renderPages) is mistaken
    // for RTL's render() and its result is required to be named `view` or
    // `utils` -- nonsense for a function returning an HTML string.
    files: ['src/__tests__/scripts/**/*.{js,jsx}'],
    rules: {
      'testing-library/render-result-naming-convention': 'off',
    },
  },
];
