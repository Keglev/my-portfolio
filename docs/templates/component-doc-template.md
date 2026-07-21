# ComponentName

[← Templates index](index.md)

One component, one document. Copy this file to `docs/architecture/`, rename it to the component name in kebab-case (e.g. `project-card.md`), and fill in each section. Check [architecture/05b-building-blocks-components.md](../architecture/05b-building-blocks-components.md) first — the component may already be catalogued there.

## Table of Contents

- [Purpose](#purpose)
- [Props](#props)
- [Usage](#usage)
- [Dependencies](#dependencies)
- [Notes](#notes)
- [References](#references)

## Purpose

One paragraph. What does this component do and why does it exist? Describe the user-visible behaviour and the problem it solves, not the implementation.

## Props

List every prop the component accepts. If the component accepts no props, replace this table with the sentence "This component accepts no props."

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `propName` | `string` | yes | — | What this prop controls and any valid values |

## Usage

Short code example showing typical usage in JSX.

```jsx
import ComponentName from './ComponentName';

<ComponentName propName="value" />
```

Add a second example if there is a meaningfully different usage pattern (e.g. with optional props, in a list, or inside a provider).

## Dependencies

What this component imports or relies on. List only non-obvious dependencies; omit React itself.

- **Components**: sub-components rendered inside this one
- **Hooks**: custom hooks called (e.g. `useTranslation`, `useProjects`)
- **i18n**: translation namespace keys consumed
- **Libraries**: third-party packages imported directly

## Notes

Edge cases, known limitations, and intentional design choices that are not obvious from reading the source. If there are none, write "No known edge cases."

## References

- [architecture/05b-building-blocks-components.md](../architecture/05b-building-blocks-components.md) — full component catalog
- [architecture/05-building-blocks.md](../architecture/05-building-blocks.md) — hierarchy diagram
