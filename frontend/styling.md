# Styling Approach

[← Frontend index](index.md)

The portfolio uses two complementary styling layers: CSS custom properties (design tokens) defined in `src/index.css`, and component-level styles written either as plain `.css` files or as `styled-components` templates. The two approaches coexist intentionally — sidebar components use `styled-components` for encapsulation, while section components use plain CSS for simplicity.

## Table of Contents

- [Style Layers](#style-layers)
- [Design Tokens](#design-tokens)
- [styled-components Layer](#styled-components-layer)
- [CSS Files Per Component](#css-files-per-component)
- [Responsive Design](#responsive-design)
- [Conventions](#conventions)
- [References](#references)

## Style Layers

Three files provide the foundation on which all component styles build.

| File | Purpose |
|------|---------|
| `src/index.css` | CSS custom properties (design tokens) and the CRA default base reset |
| `src/styles/GlobalStyles.js` | styled-components global reset: universal box-sizing, Montserrat font, dark background, base line-height |
| `src/App.css` | Two-column layout shell (`.container`, `.main-content`, `.section`) |

`GlobalStyles` is injected by the root `App` component via `<GlobalStyles />` and is always present. `index.css` is imported by `src/index.js` and makes the CSS custom properties available to every downstream stylesheet.

## Design Tokens

All colour, spacing, shadow, and transition values are defined in `src/index.css` under `:root`. Referencing tokens instead of raw values means a colour or spacing change propagates across the entire UI from one edit.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0a192f` | Page and section backgrounds |
| `--color-bg-card` | `#112240` | Project and legal card backgrounds |
| `--color-bg-card-hover` | `#1f4068` | Card hover state |
| `--color-bg-tag` | `#2b3a59` | Technology tag pill backgrounds |
| `--color-bg-subtle` | `#0f2238` | Image placeholder background |
| `--color-accent` | `#64ffda` | Headings, links, borders, icon highlights |
| `--color-text` | `#ccd6f6` | Primary body text |
| `--color-text-muted` | `#8892b0` | Secondary text (job title, captions) |
| `--shadow-accent` | `rgba(0,255,150,0.5)` | Card hover drop shadow |
| `--shadow-accent-hover` | `rgba(0,255,150,0.6)` | Image hover drop shadow |
| `--radius-card` | `8px` | Card and image border radius |
| `--transition-card` | `background-color 0.3s ease, box-shadow 0.3s ease` | Shared card hover transition |
| `--padding-section` | `5rem 2rem` | Uniform section padding |
| `--padding-card` | `1.5rem` | Uniform card internal padding |

## styled-components Layer

`src/components/Sidebar/SidebarStyles.js` defines all sidebar styled components. `styled-components` was chosen here because the sidebar has complex responsive behaviour (fixed-to-static collapse at 768px), multiple interactive states (hover transforms, active link slides), and tightly coupled dynamic logic that benefits from co-location with the component file.

| Exported component | Role |
|-------------------|------|
| `SidebarContainer` | Fixed full-height column on desktop; collapses to a static top block on mobile |
| `NameTitle` | Name and job title block; uses `clamp()` to keep the name on one line within the fixed sidebar width |
| `StyledLink` | `react-scroll` Link; slides right 10px and switches to accent colour on hover/active |
| `Menu` | Vertical nav link column; hidden via `display: none` on mobile |
| `SocialLinksWrapper` | Centering wrapper for the social icon row |
| `SocialLinks` | Social icon row with scale-and-colour hover effect |
| `FooterMessage` | Footer text and legal navigation button area |
| `LanguageWrapper` | Language toggle button group with ghost-button styling and lift-on-hover transition |
| `LegalButton` | Invisible-border `<button>` used for the Impressum and Datenschutz footer links |
| `CVDownloadWrapper` | Centering wrapper for the CV download link |
| `CVDownloadLink` | Anchor styled identically to the language buttons so both actions feel like peers |

## CSS Files Per Component

Section components each have their own `.css` file co-located in the component directory. All CSS files reference the design tokens from `src/index.css`.

| File | Covers |
|------|--------|
| `src/App.css` | Two-column flex layout shell, section scroll margins |
| `src/components/About/About.css` | Profile/bio flex layout, tech-stack grid, profile image hover and hue-rotate effect |
| `src/components/Education/Education.css` | Education entry card layout |
| `src/components/Experience/Experience.css` | Job entry timeline layout |
| `src/components/Projects/Projects.css` | Project auto-fit grid, card entrance animation, skeleton loaders, progressive image loading, error state |
| `src/components/RepoDocs/RepoDocs.css` | Repo docs card layout |
| `src/components/Legal/Legal.css` | Legal section typography overrides; reuses `.project-card` class for visual consistency |

## Responsive Design

The single layout breakpoint is `max-width: 768px`. Below it the following changes take effect.

| Element | Desktop | Mobile |
|---------|---------|--------|
| `div.container` | `flex-direction: row` | `flex-direction: column` |
| `SidebarContainer` | `position: fixed`, `width: 350px`, `height: 100vh` | `position: relative`, `width: 100%`, `height: auto` |
| `Menu` (nav links) | visible | `display: none` |
| `.main-content` | `margin-left: 350px` | `margin-left: 0` |
| `.section` padding | `2rem 0` with `--padding-section` inside | reduced |

## Conventions

- Prefer design tokens over raw hex or pixel values. If a new colour or spacing value is needed, add it to `:root` in `src/index.css` first.
- Use `styled-components` for components with multiple visual states or dynamic props tightly coupled to component logic. Use plain CSS files for simpler section components.
- Group CSS rules by concern with banner comments: `/* ─── Layout ─── */`, `/* ─── Responsive ─── */`, `/* ─── Skeleton Loader ─── */`.
- Write class names in kebab-case: `.project-card`, `.project-content`, `.tech-box`.
- Transition durations follow `--transition-card` (300ms ease) unless a component requires a distinct rhythm — for example, the sidebar hover uses a shorter 150ms ease.

## References

- [styled-components documentation](https://styled-components.com/docs)
- [MDN CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS clamp() function](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [architecture/component-tree.md](../architecture/component-tree.md) — which components own which style files
