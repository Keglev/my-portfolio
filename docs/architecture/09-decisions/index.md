# Architecture Decision Records

[← Architecture index](../index.md) · [← Documentation root](../../index.md)

This directory records the significant technical decisions made in the
my-portfolio project. Each ADR captures the context that existed at the time,
the choice that was made, and the trade-offs accepted. Reading these documents
is the fastest way to understand *why* the project is structured the way it is.

## Decisions

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](ADR-001-react.md) | React as the Frontend Framework | Accepted |
| [ADR-002](ADR-002-i18next-internationalization.md) | i18next for Internationalization | Accepted |
| [ADR-003](ADR-003-styling-approach.md) | Two-Layer Styling Approach (styled-components + plain CSS) | Accepted |
| [ADR-004](ADR-004-three-workflow-cicd.md) | Three-Workflow CI/CD Architecture | Accepted |
| [ADR-005](ADR-005-vercel-hosting.md) | Vercel as the Hosting Platform | Accepted |
| [ADR-006](ADR-006-build-time-github-data-fetch.md) | Build-Time GitHub Data Fetch over Runtime API Calls | Superseded |
| [ADR-007](ADR-007-vite-migration.md) | Vite as the Build Tool (replacing Create React App) | Accepted |
| [ADR-008](ADR-008-code-reference.md) | Keep the Generated Reference, Renamed "Code Reference" | Superseded |
| [ADR-009](ADR-009-retire-code-reference.md) | Retire the Published Code Reference | Accepted |

## How to read an ADR

Each record has four sections:

- **Context** — the forces and constraints that made a decision necessary
- **Decision** — what was chosen and exactly how it was implemented
- **Consequences** — positive and negative effects, trade-offs accepted
- **References** — links to related code, docs, or external resources

## How to add a new ADR

Copy [adr-template.md](../../templates/adr-template.md) to this directory as
`ADR-NNN-short-title.md` (where `NNN` is the next number), fill in the
sections, and add a row to the table above.

## References

- [Architecture index](../index.md)
- [Documentation root](../../index.md)
- [ADR template](../../templates/adr-template.md)
