# ADR-001: React as the Frontend Framework

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

The portfolio needed to be a single-page application with dynamic content
sections, language switching, and component reuse across sections. A static
HTML/CSS approach would require duplicating markup for every section and
language, and would make the GitHub-data-driven Projects section impractical
to implement cleanly.

The project also required a well-supported testing story (React Testing Library),
an established i18n integration (react-i18next), and zero-config build tooling
that could produce a prebuilt artifact for Vercel deployment without a custom
build server.

## Decision

Use React 18 as the UI framework, bootstrapped with Create React App (CRA /
react-scripts 5). All UI is composed from function components using hooks.

## Consequences

- Component reuse across sections is straightforward with JSX composition
- i18next integrates cleanly via the `useTranslation` hook from react-i18next
- React Testing Library provides component-level tests aligned with user behaviour
- CRA provides zero-config Webpack/Babel setup; no custom bundler configuration needed
- Adds JavaScript bundle overhead compared to a static HTML site
- CRA is in maintenance mode upstream; a future migration to Vite may be needed
- The `ErrorBoundary` component wraps the entire React tree for graceful error handling

## References

- [React documentation](https://react.dev)
- [Create React App documentation](https://create-react-app.dev)
- [react-scripts changelog](https://github.com/facebook/create-react-app/blob/main/CHANGELOG.md)
- [component-tree.md](../component-tree.md) — component hierarchy built on this decision
- [data-flow.md](../data-flow.md) — state management approach within the React tree
