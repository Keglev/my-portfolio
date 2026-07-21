# Templates Index

[← Documentation root](../index.md)

This directory contains reusable blank templates for the portfolio project. Copy the relevant file, rename it, and fill in the placeholders. Do not edit the originals in this directory — they are the canonical blank forms.

## Templates

| Template | Purpose | Where to place the filled copy |
|----------|---------|-------------------------------|
| [adr-template.md](adr-template.md) | Architecture Decision Record — captures context, decision, and consequences of a significant technical choice | `docs/adr-NNN.md` |
| [component-doc-template.md](component-doc-template.md) | Component reference page — purpose, props table, usage example, dependencies, and notes | `docs/frontend/<component-name>.md` |
| [test-plan-template.md](test-plan-template.md) | Test plan — scope, test case table, coverage targets, and run instructions for a module or feature | Alongside the module under test, or in `docs/` |

## References

- [Documentation root index](../index.md)
- [architecture/05b-building-blocks-components.md](../architecture/05b-building-blocks-components.md) — existing component catalog; check before creating a new component doc
- [TESTS.md](../architecture/08c-concepts-testing.md) — project-wide test strategy; read before creating a new test plan
