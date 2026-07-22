# ADR-003: Two-Layer Styling Approach (styled-components + plain CSS)

[← Decisions index](index.md)

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Consequences](#consequences)
- [References](#references)

## Status

Accepted

## Context

The portfolio has two structurally distinct UI areas that have different
styling requirements:

1. **The Sidebar** — fixed-position on desktop, collapses to a static top
   block on mobile, contains multiple interactive states (hover transforms,
   active-link slide animation, scale effects on social icons), and its
   visual states are tightly coupled to dynamic props passed from the
   component (e.g. `activeSection`). CSS class toggling for all these states
   would produce fragile, scattered rules.

2. **Section components** (About, Education, Projects, Experience, RepoDocs,
   Legal, at the time of this decision — the section set has since changed;
   see [Building Blocks](../05-building-blocks.md) for the current list) —
   simpler layouts with fewer interactive states and no dynamic style props.
   The overhead of CSS-in-JS for these would add build cost without
   meaningful benefit.

CSS Modules were evaluated but ruled out: at the time the project used Create React App
with a Babel/Webpack configuration that already supports CSS Modules, but
the IDE autocomplete and type-safety benefits of Modules require additional
tooling setup. For the scale of this project, the complexity was not
justified.

## Decision

Use a **two-layer approach**:

- **styled-components v6** for all Sidebar components, defined in
  `src/components/Sidebar/SidebarStyles.js`. This file exports named styled
  components (`SidebarContainer`, `NameTitle`, `StyledLink`, `Menu`,
  `SocialLinksWrapper`, `SocialLinks`, `FooterMessage`, `LanguageWrapper`,
  `LegalButton`, `CVDownloadWrapper`, `CVDownloadLink`) that co-locate
  their styles with the component logic.

- **Plain `.css` files** co-located in each section component's directory
  for all other components. These files reference CSS custom properties
  (design tokens) defined in `src/index.css`.

- **Global design tokens** defined under `:root` in `src/index.css` and
  a global reset/base in `src/styles/GlobalStyles.js` (a styled-components
  global style, always injected by `App`).

## Consequences

- The Sidebar's complex responsive and interactive behaviour is fully
  contained in one file, readable alongside the component it styles
- Section components use familiar plain CSS with no runtime overhead
- CSS custom properties propagate token changes across both layers
  from a single edit in `src/index.css`
- Two different styling mental models exist in the same codebase; new
  contributors must understand both
- styled-components adds ~13 kB gzipped to the bundle
- No class-name collisions at the component level for Sidebar styles;
  section components use kebab-case BEM-style class names by convention

## References

- [styled-components documentation](https://styled-components.com/docs)
- [MDN CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [frontend/styling.md](../08b-concepts-i18n-theming.md) — design token table and per-file breakdown
- `src/components/Sidebar/SidebarStyles.js` — all styled-component definitions
- `src/index.css` — CSS custom properties (design tokens)
