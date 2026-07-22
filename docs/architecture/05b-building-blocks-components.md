# Component Catalog

[← Architecture index](index.md)

This catalog documents every React component in `src/components/`, its purpose, the props it accepts, and how it is used in the app. Components that accept no external props are grouped in a table; components with a non-trivial prop contract each get their own table.

## Table of Contents

- [Root Components](#root-components)
- [Sidebar Components](#sidebar-components)
- [Section Components](#section-components)
- [Sub-components](#sub-components)
- [References](#references)

## Root Components

These components form the outermost shell of the application, mounted in `src/index.js`.

| Component | File | Purpose |
|-----------|------|---------|
| `App` | src/App.js | Wraps the tree in `ThemeProvider`; composes `Sidebar` with the `main-content` scroll container holding the six section components; imports `GlobalStyles` and `SpeedInsights` |
| `ErrorBoundary` | src/components/ErrorBoundary/ErrorBoundary.js | Class component wrapping `App` (one level inside `React.StrictMode`, per `src/index.js`); renders a hardcoded (non-i18n) fallback message on any uncaught render error, deliberately not routed through `t()` in case the crash is i18n-related itself |

### ErrorBoundary props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | ReactNode | yes | The subtree to watch; any component that throws during render triggers the error fallback UI |

## Sidebar Components

`Sidebar` is fixed to the left of the viewport on desktop and collapses into a static top block on mobile (see [08b's responsive design table](08b-concepts-i18n-theming.md#responsive-design)).

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | src/components/Sidebar/Sidebar.js | Fixed navigation column; owns `activeSection` scroll-tracking state, renders the name/title block and footer directly, and passes `activeSection` down to `SidebarMenu` |
| `SidebarMenu` | src/components/Sidebar/SidebarMenu.js | Navigation links, the DE/EN language switch, the theme toggle button, and the locale-aware CV download link |

### SidebarMenu props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeSection` | string | yes | ID of the section currently in view (e.g. `'About'`, `'Projects'`); controls which nav link receives the active highlight |

`Sidebar` derives `activeSection` from scroll position via a `window.scroll` listener, then passes it to `SidebarMenu`. See [06-runtime.md](06-runtime.md) for the full state flow.

## Section Components

All six section components accept no external props; they source their content via `useTranslation()` and, where applicable, a static config module. Each is rendered inside a `div.section` wrapper in `App.js`, with an `id` that acts as a scroll target.

| Component | Section ID | i18n key group | Data source |
|-----------|-----------|---------------|-------------|
| `Hero` | `Hero` | `hero` | i18n locale JSON |
| `About` | `About` | `aboutSection` | i18n locale JSON; renders `CareerStrip` as its final child |
| `Skills` | `SkillsSection` | `skills`, `skillsSection` | `data/skills.config` (group structure) + i18n locale JSON (labels) |
| `Projects` | `Projects` | `projects`, `portfolioMeta` | `data/projects.config` (static, no fetch) |
| `Contact` | `ContactSection` | `contactSection` | Web3Forms API (`VITE_WEB3FORMS_KEY` env var) |
| `Legal` | `Impressum`, `Datenschutz` | `legal` | i18n locale JSON (HTML strings via `dangerouslySetInnerHTML`) |

## Sub-components

Sub-components are rendered by parent section components and receive data as props.

### CareerStrip

Rendered by `About` as its final child, not standalone. Renders a two-column strip (career stations, education) from `aboutSection.career` and `aboutSection.educationItems` i18n list resources. Its wrapper `id="Career"` is the scroll target of `Hero`'s "Experience" CTA. Accepts no props.

### ProjectCard

Rendered by `Projects`, once per entry in `data/projects.config`. Displays a theme- and language-aware preview image, title, summary (via `ProjectSummary`), technology tags, and up to five links in a locked order (live app, docs hub, repo, optional second repo, API reference). Falls back to an inline SVG placeholder (`projectsUtils.generatePlaceholderSVGDataUrl`) on image load failure.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | object | yes | Curated project entry from `data/projects.config` |
| `index` | number | yes | Position in the projects array; used as the key into `loadedImages` |
| `loadedImages` | object | no (default `{}`) | Map of `index → boolean` tracking which images have finished loading |
| `setLoadedImages` | function | no (default no-op) | State setter lifted from `Projects`; called when an image loads or all fallbacks are exhausted |

### ProjectSummary

Rendered inside `ProjectCard`. Selects `project.summaryDe` or `project.summaryEn` by strict equality on the `language` prop — both fields are always present in the config, so there is no missing-translation fallback path to document.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | object | yes | Curated project entry from `data/projects.config` |
| `language` | string | yes | Active i18n locale code (`'en'` or `'de'`), passed through as-is from `ProjectCard`'s `i18n.language` |

## References

- [React component documentation](https://react.dev/learn/your-first-component)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [05-building-blocks.md](05-building-blocks.md) — visual component hierarchy diagram
- [06-runtime.md](06-runtime.md) — how props and state flow between components
