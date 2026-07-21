# Architecture Index

[← Documentation root](../index.md)

arc42 architecture documentation for the personal portfolio application, chapters 01 through 12. This index is a thin table of contents only — each chapter lives in its own numbered file. Chapters without a natural arc42 fit for a project this size (as noted per-row below) still exist as real short pages rather than being silently dropped.

## Chapters

| # | Chapter | Description |
|---|---------|-------------|
| 01 | [Introduction and Goals](01-introduction-and-goals.md) ([DE](01-introduction-and-goals.de.md)) | What the app is, tech stack table, high-level component diagram, key design decisions, and non-functional requirements |
| 02 | [Constraints](02-constraints.md) | Organizational and technical constraints that shaped the architecture |
| 03 | [Context and Scope](03-context.md) | External systems, actors, and data flow across the system boundary |
| 04 | [Solution Strategy](04-solution-strategy.md) | The small set of decisions that shaped everything else |
| 05 | [Building Blocks](05-building-blocks.md) ([Components](05b-building-blocks-components.md)) | React component hierarchy and per-component prop catalog |
| 06 | [Runtime View](06-runtime.md) ([Routing](06b-runtime-routing.md)) | Build-time and runtime data flow, state management, and navigation model |
| 07 | [Deployment](07-deployment.md) ([Configuration](07b-deployment-configuration.md)) | CI/CD pipeline, Vercel deployment, and environment configuration |
| 08 | [Crosscutting Concepts](08-concepts.md) ([i18n & Theming](08b-concepts-i18n-theming.md), [Testing](08c-concepts-testing.md), [Build Tooling](08d-concepts-build-tooling.md)) | Concerns that cut across multiple building blocks |
| 09 | [Architecture Decisions](09-decisions/index.md) | Architecture Decision Records — the *why* behind each significant technical choice |
| 10 | [Quality Requirements](10-quality-requirements.md) | Quality tree and concrete quality scenarios |
| 11 | [Risks and Technical Debt](11-risks-technical-debt.md) | Known risks and the deferred-work backlog |
| 12 | [Glossary](12-glossary.md) | Terms and abbreviations used throughout these docs |

## References

- [Documentation root index](../index.md)
- [GitHub repository — Keglev/my-portfolio](https://github.com/Keglev/my-portfolio)
- [Live docs — GitHub Pages](https://keglev.github.io/my-portfolio/)
