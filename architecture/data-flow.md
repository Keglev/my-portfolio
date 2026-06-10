# Data Flow

[← Architecture index](index.md)

This document explains how data moves through the portfolio at build time and at runtime, and describes the state management approach.

## Table of Contents

- [Build-Time Data Preparation](#build-time-data-preparation)
- [Runtime Data Flow](#runtime-data-flow)
- [State Management Approach](#state-management-approach)
- [References](#references)

## Build-Time Data Preparation

Before the React bundle is served, GitHub Actions runs `scripts/fetchProjects.js` to fetch pinned repository metadata via the GitHub GraphQL API. The output — `public/projects.json` and `public/projects_media/` — is bundled into the Vercel deployment as static assets. Every project card and documentation link in the live site originates from this pre-generation step; there are no runtime calls to the GitHub API.

## Runtime Data Flow

The diagram below shows the principal data flows during a user session. Arrows represent data movement; node labels identify the source or consumer.

```mermaid
flowchart TD
    ProjectsJSON["public/projects.json\n(static asset on Vercel)"]
    useProjects["useProjects hook\n(fetch on mount)"]
    ProjectsState["projects state\n(useState in Projects)"]
    ProjectCard["ProjectCard\n(project prop)"]
    ProjectSummary["ProjectSummary\n(project prop)"]
    LocaleFiles["Locale JSON\n(en.json / de.json)"]
    i18next["i18next instance\n(initialised at startup)"]
    AllComponents["Translated components\n(useTranslation hook)"]
    ScrollEvent["window scroll event"]
    ActiveSectionState["activeSection state\n(useState in Sidebar)"]
    SidebarMenu["SidebarMenu\n(activeSection prop)"]

    ProjectsJSON -->|"HTTP GET at mount"| useProjects
    useProjects -->|"setProjects"| ProjectsState
    ProjectsState -->|"project prop"| ProjectCard
    ProjectsState -->|"project prop"| ProjectSummary
    LocaleFiles -->|"bundled at build"| i18next
    i18next -->|"t() calls"| AllComponents
    ScrollEvent -->|"setActiveSection"| ActiveSectionState
    ActiveSectionState -->|"activeSection prop"| SidebarMenu

    class ProjectsJSON,LocaleFiles,ScrollEvent l1
    class useProjects,i18next,ActiveSectionState l2
    class ProjectsState,AllComponents,SidebarMenu l3
    class ProjectCard,ProjectSummary l4

    classDef l1 fill:#1e2d4f,stroke:#3B82F6,stroke-width:2px,color:#E2E8F0
    classDef l2 fill:#2a3d62,stroke:#60A5FA,stroke-width:2px,color:#E2E8F0
    classDef l3 fill:#37507a,stroke:#93C5FD,stroke-width:2px,color:#E2E8F0
    classDef l4 fill:#466090,stroke:#BFDBFE,stroke-width:2px,color:#E2E8F0
```

## State Management Approach

The app uses no global state management library such as Redux, Zustand, or MobX. State is owned by the component that needs it and passed down as props where children require it. This was a deliberate choice: the portfolio has no cross-component shared mutable state that would justify the overhead of a centralised store.

| State | Owner | Shared via |
|-------|-------|-----------|
| Project list (fetch lifecycle) | `useProjects` hook → `Projects` | Props to `ProjectCard`, `ProjectSummary` |
| Active nav section | `Sidebar` | Prop to `SidebarMenu` |
| Current language | i18next module instance | `react-i18next` context (not component state) |
| Legal / nav scroll targets | No state — DOM `getElementById` calls | — |

Language selection is the one exception to pure component state: i18next maintains the current locale in its own module-level instance. All components subscribe to locale changes via the `useTranslation()` hook, which internally consumes the React context provided automatically by `initReactI18next`.

## References

- [React useState documentation](https://react.dev/reference/react/useState)
- [i18next changeLanguage API](https://www.i18next.com/overview/api#changelanguage)
- [component-tree.md](component-tree.md) — where each stateful component sits in the hierarchy
- [i18n-flow.md](i18n-flow.md) — language-switch sequence in detail
