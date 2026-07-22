# my-portfolio

**Bilingual (DE/EN) personal portfolio — React 18, Vite, styled-components, deployed on Vercel**

![CI](https://github.com/Keglev/my-portfolio/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/Keglev/my-portfolio/actions/workflows/deploy.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

A single-page portfolio presenting my work as a software engineer: an introduction, a career and education strip, a skills overview, a project showcase, a contact form, and legal notices — every section available in German and English. German is the default locale rather than the fallback, because the intended audience is German-speaking recruiters and employers and the site should open in their language.

The application has no backend of its own. Project data is hand-curated code bundled at build time, and the only outbound request a visitor's browser makes is the contact form's submission. That constraint shapes everything below.

**Live site:** <https://carloskeglevich.de>

---

## Table of Contents

1. [Technical Highlights](#technical-highlights)
2. [Screenshots](#screenshots)
3. [Architecture & Documentation](#architecture--documentation)
4. [Tech Stack](#tech-stack)
5. [Quick Start](#quick-start)
6. [Testing & Code Quality](#testing--code-quality)
7. [CI/CD & Deployment](#cicd--deployment)
8. [License](#license)
9. [Contact](#contact)

---

## Technical Highlights

- **Internationalisation as structure, not string swapping.** i18next with German configured as the default and English as the fallback. Section content lives in translation catalogues rather than in components, so switching language re-renders from data and no component holds a hard-coded sentence.
- **A two-theme design token system.** Every colour, spacing, and shadow value is a CSS custom property declared twice — once for dark, once under `[data-theme='light']`. Components reference token *names*, so no component needs to know which theme is active. Card-scoped tokens deliberately invert, keeping cards dark on a light page.
- **Four-workflow conditional CI/CD.** A change-scope resolver decides which downstream work a push actually needs, then dispatches deployment and documentation publishing *in parallel* rather than in sequence. A documentation edit never rebuilds the app; a source change never waits on docs.
- **A documentation site, generated and published.** Twelve arc42 chapters and nine architecture decision records, built from Markdown by the project's own scripts and deployed to GitHub Pages with a bilingual landing page.
- **Coverage enforced per file, not in aggregate.** Every measured module carries its own 85% threshold, with a short list of documented exceptions that each name the uncovered mechanism and the cost of covering it. An aggregate percentage would let a well-covered module hide an untested one.

---

## Screenshots

Both are the German interface, which is what a first-time visitor sees.

<img src="docs/assets/readme/project-image.png" alt="Hero section in dark theme and German: sidebar navigation, DE/EN and theme switches, headline, three call-to-action buttons, and a profile photo" width="600"/>

*Hero and profile, dark theme. The sidebar carries the section navigation, the DE/EN switch, and the theme toggle; the same three controls persist on every section.*

<img src="docs/assets/readme/project-image2.png" alt="Projects section in light theme and German: two project cards with preview images, descriptions, and technology tags" width="600"/>

*Projects, light theme — the same components under the second token set. Each card carries a preview image, a description, and technology tags, all from the hand-curated project data.*

---

## Architecture & Documentation

The documentation site is the source of truth; this README links into it rather than restating it.

- [Documentation site](https://keglev.github.io/my-portfolio/) — bilingual landing page
- [Architecture (arc42)](https://keglev.github.io/my-portfolio/architecture/index.html) — twelve chapters, from goals and constraints through building blocks, runtime, deployment, and glossary
- [Architecture decision records](https://keglev.github.io/my-portfolio/architecture/09-decisions/index.html) — nine ADRs, including the migration off Create React App and the test-runner consolidation
- [Test coverage report](https://keglev.github.io/my-portfolio/coverage/index.html) — regenerated on every CI run and republished automatically

---

## Tech Stack

**Application**
- React 18, Vite 8
- styled-components for interactive components; CSS custom properties for the token system
- i18next and react-i18next (DE/EN), react-scroll for in-page navigation
- Web3Forms for the contact form — a static-site form backend, so the project needs no server of its own

**Tooling**
- Vitest with the istanbul coverage provider — one runner, with a Jest-compatible API
- ESLint 9 (flat config)
- GitHub Actions; Vercel for the application, GitHub Pages for documentation and coverage

---

## Quick Start

Prerequisites: **Node 24** — the version CI uses.

```bash
git clone https://github.com/Keglev/my-portfolio.git
cd my-portfolio
npm ci

npm run dev      # development server on http://localhost:3000
npm test         # full test suite
npm run build    # production build into dist/
```

The contact form needs a Web3Forms access key to deliver anything; the rest of the site runs without one. Copy `.env.example` to `.env` and set `VITE_WEB3FORMS_KEY`. The `VITE_` prefix is required — Vite exposes only prefixed variables to client code.

---

## Testing & Code Quality

One runner: Vitest, in a jsdom environment, with the istanbul coverage provider. Its Jest-compatible API keeps the assertion and mocking style unchanged across the migration, while the transform pipeline is the application's own.

- **241 tests across 27 files** — components, hooks, context, the i18n catalogues, and the build and CI scripts
- **Thresholds are enforced in CI, per file.** The build fails when any measured module drops below its own threshold, so a regression cannot be averaged away
- Each documented exception names the specific uncovered mechanism and what covering it would cost — see [Testing concepts (arc42 §8c)](https://keglev.github.io/my-portfolio/architecture/08c-concepts-testing.html)
- `npm run audit:ci` fails on any high or critical advisory outside a written allowlist, where every waiver records the dependency path and why it cannot reach a user

---

## CI/CD & Deployment

Four workflows. `ci.yml` runs lint, the test suite, and coverage on every push and pull request; on a push to `main` it resolves what changed and dispatches `deploy.yml` (always) and `coverage.yml` (only when a source change could have altered the report) at the same time, so deployment and documentation publishing run in parallel. `architecture-docs.yml` sits outside that chain and triggers directly on documentation pushes, which keeps a typo fix out of the build pipeline. Each workflow holds its own concurrency group — a shared one once let a queued documentation run silently cancel the queued deploy, and no build reached production until that was found.

Deployment ships a prebuilt artifact: GitHub Actions builds the application and hands Vercel a finished `.vercel/output/`, so Vercel performs no build step of its own. The result is smoke-tested against the live domain rather than the generated `*.vercel.app` URL, because a healthy build behind broken DNS should fail the deploy, not pass it.

---

## License

Released under the [MIT License](LICENSE). Free to use, modify, and distribute, including commercially, with attribution.

---

## Contact

Questions or suggestions: [open an issue](https://github.com/Keglev/my-portfolio/issues), or use the contact form on the [live site](https://carloskeglevich.de).
