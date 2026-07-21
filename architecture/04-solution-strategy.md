# Solution Strategy

[← Architecture index](index.md)

The handful of decisions that shaped everything else: static, hand-curated project data instead of a runtime GitHub API dependency; a Vercel prebuilt-artifact deploy for full build-environment control; two separate Jest runners to avoid Babel/CSS transform conflicts; German as the default locale; and no client-side state library, since component-local `useState` is sufficient.

*Full chapter content pending — will be promoted from the "Key Design Decisions" section of [01-introduction-and-goals.md](01-introduction-and-goals.md), each point linked to its full [ADR](09-decisions/index.md).*
