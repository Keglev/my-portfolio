# Component Catalog

[← Architecture index](index.md)

This catalog documents every React component in `src/components/`, its purpose, the props it accepts, and how it is used in the app. Section components that accept no external props are grouped in a table; components with non-trivial prop contracts each get their own table.

## Table of Contents

- [Root Components](#root-components)
- [Sidebar Components](#sidebar-components)
- [Section Components](#section-components)
- [Sub-components](#sub-components)
- [Custom Hooks](#custom-hooks)
- [References](#references)

## Root Components

These two components form the outermost shell of the application. They are mounted in `src/index.js`.

| Component | File | Purpose |
|-----------|------|---------|
| `App` | src/App.js | Composes `Sidebar` with the `main-content` scroll container; imports `GlobalStyles` and `SpeedInsights` |
| `ErrorBoundary` | src/components/ErrorBoundary.js | Class component wrapping the entire tree; renders a fallback message on any uncaught render error |

### ErrorBoundary props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | ReactNode | yes | The subtree to watch; any component that throws during render triggers the error fallback UI |

## Sidebar Components

The sidebar group is composed inside `Sidebar` and stays fixed to the left of the viewport on desktop. On mobile it collapses into a static top block.

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | src/components/Sidebar/Sidebar.js | Fixed navigation column; owns `activeSection` scroll-tracking state and passes it down to `SidebarMenu` |
| `SidebarMenu` | src/components/Sidebar/SidebarMenu.js | Navigation links, language toggle buttons, and the locale-aware CV download link |
| `SidebarSocial` | src/components/Sidebar/SidebarSocial.js | Row of icon links to GitHub, LinkedIn, Xing, and email |

### SidebarMenu props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeSection` | string | yes | ID of the section currently in view (e.g. `'About'`, `'Projects'`); controls which nav link receives the active highlight |

`Sidebar` derives `activeSection` from scroll position via a `window.scroll` listener, then passes it to `SidebarMenu`. See [architecture/data-flow.md](06-runtime.md) for the full state flow.

`SidebarSocial` accepts no props. All social URLs are hardcoded inside the component.

## Section Components

All six section components accept no external props. They source their content via `useTranslation()` or internal custom hooks. Each is rendered inside a `div.section` wrapper in `App.js`, with an `id` that acts as a scroll target.

| Component | Section ID | i18n key group | Data source |
|-----------|-----------|---------------|-------------|
| `About` | `About` | `aboutSection` | i18n locale JSON |
| `Education` | `Education` | `educationSection` | i18n locale JSON |
| `Projects` | `Projects` | `projects` | `public/projects.json` via `useProjects` hook |
| `RepoDocs` | `RepoDocs` | `repoDocs` | `public/projects.json` via `useRepoDocs` hook |
| `Experience` | `Experience` | `experienceSection` | i18n locale JSON |
| `Legal` | `Impressum`, `Datenschutz` | `legal` | i18n locale JSON (HTML strings via `dangerouslySetInnerHTML`) |

## Sub-components

Sub-components are rendered by parent section components and receive data as props.

### ProjectCard

Rendered by `Projects`. Displays a single project tile with image, summary, technology tags, and action links. Implements a three-step image fallback chain: local static asset → GitHub `main` branch → GitHub `master` branch → SVG placeholder.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | object | yes | Project data object from `projects.json` |
| `image` | string | yes | Primary image URL resolved by the parent via `getPrimaryImage()` |
| `index` | number | yes | Position in the projects array; used as the key into `loadedImages` |
| `loadedImages` | object | yes | Map of `index → boolean` tracking which images have finished loading |
| `setLoadedImages` | function | yes | State setter lifted from `Projects`; called when an image loads or all fallbacks are exhausted |

### ProjectSummary

Rendered inside `ProjectCard`. Selects the best available description in priority order: German `summary_de` from `projects.json` → README About section → generic `summary` field. Renders a skeleton placeholder while all sources are empty.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | object | yes | Project data object from `projects.json` |
| `language` | string | yes | Active i18n locale code (`'en'` or `'de'`) |
| `t` | function | yes | i18next `t()` function forwarded from `ProjectCard` |

### RepoDocLinks

Rendered inside `RepoDocs`. Outputs documentation links for one repository by checking fields in priority order: `placeholder` → `apiDocumentation` → `architectureOverview` → `productionUrl` → `testing.coverage[]` → generic `docsLink` fallback.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | object | yes | Enriched project object from `useRepoDocs`; expected to contain a `repoDocs` sub-object |

## Custom Hooks

| Hook | File | Returns | Description |
|------|------|---------|-------------|
| `useProjects` | src/components/Projects/useProjects.js | `{ projects, loadedImages, setLoadedImages }` | Fetches `public/projects.json` on mount; owns the loading and error lifecycle |
| `useRepoDocs` | src/components/RepoDocs/useRepoDocs.js | `Project[]` | Derives the subset of projects that have at least one documentation link |

## References

- [React component documentation](https://react.dev/learn/your-first-component)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [architecture/component-tree.md](05-building-blocks.md) — visual component hierarchy diagram
- [architecture/data-flow.md](06-runtime.md) — how props and state flow between components
