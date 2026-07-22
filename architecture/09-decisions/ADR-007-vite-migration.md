# ADR-007: Vite as the Build Tool (replacing Create React App)

[← Decisions index](index.md)

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Consequences](#consequences)
- [References](#references)

## Status

Accepted (2026-07-22).

Supersedes the build-tooling half of [ADR-001](ADR-001-react.md), which chose
Create React App as the toolchain. The choice of React itself is unaffected and
remains Accepted.

Also corrects [ADR-005](ADR-005-vercel-hosting.md), which documented
`vercel.json`'s `buildCommand` as `"react-scripts build"`. It is now
`"vite build"` with an explicit `outputDirectory: "dist"`. ADR-005's actual
decision — prebuilt artifact deployment via the Vercel Build Output API — is
unchanged, and that `buildCommand` remains unexercised because `--prebuilt`
skips Vercel's build step entirely.

## Context

The project was built with Create React App via `react-scripts@5.0.1`.

**CRA is dead.** The React team formally deprecated it in February 2025 and
removed it from the official documentation as a recommended way to start a
project. `react-scripts` has had no functional release since 5.0.1 (January
2022). It is not a question of preference: nothing in that dependency tree is
receiving security patches.

**The transitive tree was the real cost.** `react-scripts` pulled in a full
webpack 5 stack, its own babel toolchain, `webpack-dev-server`, `@svgr/webpack`,
`workbox`, and a pinned ESLint 8. Measured before the migration:

| Metric | Value |
|---|---|
| `npm ls --all` output | 3885 lines |
| `npm audit` findings | 28 (1 critical, 13 high, 4 moderate, 10 low) |
| High/critical inside the react-scripts subtree | 10 of 14 |

The `package.json` `overrides` block had grown to six entries
(`@pmmmwh/react-refresh-webpack-plugin`, `nth-check`, `postcss`, `svgo`,
`resolve-url-loader`, `serialize-javascript`), every one of them a manual pin
patching a vulnerability inside a CRA transitive that upstream would never fix.
That block was a maintenance treadmill with no end state.

**Secondary costs.** `.npmrc` carried a global `legacy-peer-deps=true` solely
because `react-scripts@5` conflicts with strict peer resolution — a blunt
instrument that suppressed peer warnings repo-wide. ESLint was frozen at 8
because `eslint-config-react-app` shipped inside `react-scripts` and pinned it.
And CRA's bundled Jest runner was one of two runners in the repo, both executing
the identical 24 test files — measured, not assumed, by comparing `--listTests`
output from each. Consolidating them is follow-on work and is not decided here.

Alternatives considered:

1. **Stay on CRA.** Rejected: the vulnerability count only grows, and each new
   finding requires another hand-written override.
2. **Eject.** Rejected: `react-scripts eject` makes the unmaintained webpack
   config *our* unmaintained webpack config. Strictly worse.
3. **Next.js.** Rejected: this is a static single-page portfolio with no
   routing, no server rendering, and no data fetching. Next.js would add a
   framework to remove a build tool.
4. **Vite.** Chosen — see below.

## Decision

Adopt **Vite 8** (`vite` + `@vitejs/plugin-react`) as the build tool, and
remove `react-scripts` entirely.

Concretely:

- **Entry point.** `index.html` moves from `public/` to the repo root, with an
  explicit `<script type="module" src="/src/index.jsx">`. Vite treats
  `index.html` as the entry module; it does not inject the script tag the way
  CRA's HtmlWebpackPlugin did. All `%PUBLIC_URL%` scaffolding is gone — it was
  verified to be comment text only, with zero real substitutions.
- **`public/` becomes pure static passthrough.** The CV PDFs, project
  screenshots, and profile images are referenced by root-absolute path from
  `src/`, which keeps working only because Vite copies `publicDir` verbatim
  without hashing.
- **Environment variables.** `REACT_APP_WEB3FORMS_KEY` →
  `VITE_WEB3FORMS_KEY`, read as `import.meta.env.VITE_WEB3FORMS_KEY`. Vite
  only exposes `VITE_`-prefixed variables to client code.
- **JSX file extensions.** The 15 source files containing real JSX are renamed
  `.js` → `.jsx`. Vite 8 (rolldown/oxc) refuses JSX inside `.js` and, unlike
  Vite 5, no longer offers an `esbuild: { loader: 'jsx' }` escape hatch; oxc's
  `.js`-as-JSX loader applies to dependency pre-bundling only, not to source.
  The 8 plain-JS modules keep `.js`.
- **Build output.** `build/` → `dist/`, reflected in `vercel.json`,
  `scripts/prepareVercelOutput.sh`, and `.gitignore`.
- **Browser targets.** `.browserslistrc` is **deleted** and no
  `@vitejs/plugin-legacy` is added. Vite reads `build.target`, not
  browserslist, so the file was already inert. `build.target` is left at Vite's
  modern default: the audience for a developer portfolio runs current browsers,
  and shipping legacy transpilation plus polyfills to serve hypothetical
  IE-era traffic is cost without benefit.
- **ESLint 8 → 9, flat config** (`eslint.config.mjs`). Forced by the removal of
  `eslint-config-react-app`; rule parity is documented per-block in the config
  file itself.
- **`.npmrc` deleted.** `legacy-peer-deps` is no longer needed; verified by a
  full clean `npm install` with no `.npmrc` present.

## Consequences

### npm audit, before and after

| Severity | Before | After |
|---|---|---|
| Critical | 1 | **0** |
| High | 13 | **4** |
| Moderate | 4 | **0** |
| Low | 10 | **0** |
| **Total** | **28** | **4** |

`npm ls --all` output dropped from 3885 to 1890 lines — a 51% smaller
dependency graph.

The four remaining findings, all `high`, all dev-only (none ship to the
browser):

| Package | Path | Disposition |
|---|---|---|
| `form-data` | `jest-environment-jsdom` → `jsdom@20` | Expected to clear when the test runner migrates — a current jsdom carries the fix |
| `js-yaml` | `babel-jest` → `babel-plugin-istanbul` → `@istanbuljs/load-nyc-config` | Expected to clear when the test runner migrates off babel-jest |
| `linkify-it` | `jsdoc` → `markdown-it` | Permanent while JSDoc is kept; covered by the approved `audit-check.js` allowlist |
| `brace-expansion` | `eslint-plugin-jsx-a11y`, `eslint-plugin-testing-library` | **Introduced by this migration's own ESLint 9 toolchain** |

The `overrides` block is gone. Every entry pinned a package that no longer
exists in the tree.

### Other consequences

- **Build time** fell from tens of seconds to well under a second (639 ms for a
  102-module production build), because Vite 8 bundles with rolldown rather
  than webpack.
- **Sourcemaps are now published** with the deployed bundle
  (`build.sourcemap: true`). This is a public portfolio whose source is already
  on GitHub; readable production stack traces are worth more than the bytes.
- **A new failure mode was introduced and guarded.** If `VITE_WEB3FORMS_KEY` is
  unset, the build still *succeeds* and silently ships an empty access key,
  breaking the contact form in production with no CI signal. `deploy.yml` gained
  an explicit pre-build presence check (value never printed) because a green
  build that quietly breaks a feature is worse than a red one.
- **A temporary Jest bridge exists.** Babel's CommonJS output cannot represent
  `import.meta`, so `config/jest/importMetaEnvBabelPlugin.js` rewrites
  `import.meta.env` → `process.env` for the Jest transform only. It is scoped to
  test configuration so the source stays in its final idiomatic form, and it is
  removed when the runner migrates to a toolchain that reads `import.meta.env`
  natively.
- **Contributor-facing changes:** `npm start` still works (aliased to `vite`),
  `npm run dev` is the idiomatic name, and `npm run preview` serves a
  production build locally. `npm run eject` no longer exists and has no
  meaning.
- **Documentation debt created by this ADR.** 44 references to Create React App
  or `react-scripts` remain across 20 files under `docs/` and `README.md`.
  They are now factually wrong and are corrected in a dedicated follow-up
  branch, not here.

## References

- [React: Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app) — the February 2025 deprecation announcement
- [Vite documentation](https://vite.dev/)
- [Vite: Migration from CRA](https://vite.dev/guide/migration.html)
- [ADR-001](ADR-001-react.md) — chose React and, at the time, CRA
- [ADR-005](ADR-005-vercel-hosting.md) — prebuilt Vercel deployment, whose `buildCommand` this ADR corrects
- [Build tooling](../08d-concepts-build-tooling.md) — the tooling reference chapter
- `vite.config.js`, `eslint.config.mjs` — both fully commented with the reasoning behind each option
