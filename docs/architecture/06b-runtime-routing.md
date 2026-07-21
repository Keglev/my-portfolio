# Page Structure and Navigation

[← Architecture index](index.md)

The portfolio is a single-page application with no URL-based routing. All content lives in one scrollable document; navigation is driven by scroll position. Clicking a sidebar link smooth-scrolls the content area to the target section. No page transitions occur, no browser history entries are pushed, and no `react-router-dom` routes are configured.

## Table of Contents

- [Navigation Model](#navigation-model)
- [Section Registry](#section-registry)
- [Scroll Navigation Sequence](#scroll-navigation-sequence)
- [Active Section Tracking](#active-section-tracking)
- [References](#references)

## Navigation Model

`SidebarMenu` uses react-scroll's `<Link>` component to scroll to a named DOM `id` inside `div#scroll-container`. The `containerId="scroll-container"` prop scopes the animation to the `main-content` div rather than `window`, which avoids conflicts on mobile where the sidebar and content stack vertically.

`react-router-dom` is not a dependency of this project — `package.json` lists only `react-scroll` for navigation. There is no routing library to not-use; scroll-based navigation was the only mechanism ever wired in for the current design.

## Section Registry

`SidebarMenu` defines its navigation items in the `NAV_ITEMS` constant. Each entry maps a DOM `id` to the i18n key used as the link label. `Hero` and `Legal` are both intentionally absent from `NAV_ITEMS`: `Hero` is the page's default scroll position (nothing points back to it from the nav), and `Legal`'s two sub-sections are reached via scroll buttons in the sidebar footer instead.

| Section ID | i18n key | App.js wrapper | Notes |
|-----------|---------|----------------|-------|
| `About` | `about` | `div.section#About` | In `NAV_ITEMS`; fallback active section when scroll position matches nothing in `SECTIONS` (see below) |
| `Skills` | `skills` | `div.section#Skills` | In `NAV_ITEMS` |
| `Projects` | `projects` | `div.section#Projects` | In `NAV_ITEMS`; data-driven from `data/projects.config` |
| `Contact` | `contact` | `div.section#Contact` | In `NAV_ITEMS` |
| `Hero` | — | `div.section#Hero` | Not in `NAV_ITEMS` or `SECTIONS` — the page's top, not a nav destination |
| `Impressum` | — | inside `div.section#Legal` | Scroll target for a `LegalButton` in the sidebar footer; not in `NAV_ITEMS` |
| `Datenschutz` | — | inside `div.section#Legal` | Scroll target for a `LegalButton` in the sidebar footer; not in `NAV_ITEMS` |

## Scroll Navigation Sequence

The diagram below traces a navigation click from the sidebar through to the highlighted active link.

```mermaid
sequenceDiagram
    participant User
    participant SidebarMenu
    participant ReactScroll as react-scroll Link
    participant ScrollContainer as div#scroll-container
    participant Sidebar

    User->>SidebarMenu: clicks nav link (e.g. "Projects")
    SidebarMenu->>ReactScroll: smooth=true, to="Projects", containerId="scroll-container"
    ReactScroll->>ScrollContainer: animates scrollTop to (div#Projects.offsetTop − 10px)
    ScrollContainer-->>Sidebar: window scroll event fires
    Sidebar->>Sidebar: recalculates activeSection from scroll position
    Sidebar-->>SidebarMenu: updated activeSection prop ("Projects")
    SidebarMenu-->>User: "Projects" nav link highlighted
```

The `offset={-10}` prop on each `StyledLink` stops the scroll slightly *before* the section heading, not after it — there is no fixed top bar to compensate for on this layout (sidebar is fixed only on desktop; on mobile it's a static block, not an overlay), so the offset's purpose is purely to avoid landing exactly flush with the heading's top edge.

## Active Section Tracking

`Sidebar` recalculates the active section on every scroll event by iterating the `SECTIONS` constant bottom-to-top:

```js
const SECTIONS = ['Legal', 'Contact', 'Projects', 'Skills'];
```

It compares `window.scrollY + window.innerHeight / 2` (the viewport midpoint) against each section's `offsetTop`. The first match wins, ensuring the deepest section the user has scrolled past is always highlighted. If no section matches (the user is above `Skills`, i.e. still in `Hero` or `About`), the fallback is `'About'`.

Iterating bottom-to-top is the key invariant: without it, a user who has scrolled past `Projects` and into `Contact` would see `Projects` highlighted instead of `Contact`, because `Projects` appears earlier in a top-to-bottom pass.

## References

- [react-scroll documentation](https://github.com/fisshy/react-scroll)
- [05b-building-blocks-components.md](05b-building-blocks-components.md) — props for `Sidebar` and `SidebarMenu`
- [06-runtime.md](06-runtime.md) — activeSection state ownership
- [05-building-blocks.md](05-building-blocks.md) — where sidebar components sit in the hierarchy
