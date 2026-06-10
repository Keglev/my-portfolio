# ADR-002: i18next for Internationalization

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

The portfolio targets both German and international employers. All visible
strings — section headings, bio text, job entries, legal notices — needed
to switch between German and English without page reloads. Additionally,
project descriptions fetched from the GitHub API at build time arrive in
English and need a German counterpart for the German-language view.

Two concerns had to be addressed separately:

1. **Static UI strings** — hand-authored content such as the bio, job
   history, and section labels, stored as JSON and bundled at build time.
2. **Dynamic project descriptions** — English text from GitHub that must be
   translated to German automatically during the CI/CD fetch step.

## Decision

Use i18next 25 with react-i18next 14 for all static UI strings.
Translations are stored in two locale files bundled directly into the
JavaScript build:

- `src/locales/en.json` — English strings
- `src/locales/de.json` — German strings

Both files use a single `translation` namespace (the i18next default).
The i18next instance is configured in `src/i18n.js` with:

- `lng: 'de'` — German as the default display language, targeting the
  German job market
- `fallbackLng: 'en'` — falls back to the English string if a key is
  absent from the German locale file
- `interpolation.escapeValue: false` — React already escapes values;
  disabling prevents double-escaping
- `compatibilityJSON: 'v3'` — matches the plural-key format in the locale files

For dynamic project descriptions, the DeepL free-tier API
(`https://api-free.deepl.com/v2/translate`) translates English GitHub
descriptions to German during the `scripts/fetchProjects.js` build step.
Translations are cached per repository in
`public/projects_media/{repo}/meta.json` using an md5 key so identical
strings are only sent to DeepL once. If the DeepL API is unavailable or
the key is absent, the translation result is `null` and the React component
falls back to displaying the English original.

## Consequences

- Language switching is instant with no network request after initial load,
  because both locale files are bundled at build time
- Adding a third language requires new locale JSON files and a corresponding
  DeepL target language in the fetch script
- The `fallbackLng: 'en'` setting means a missing German key silently
  displays English rather than an error; locale files must be kept in sync
- DeepL translations for project descriptions are cached; unchanged
  descriptions do not consume API quota on subsequent builds
- The DeepL free tier has a monthly character limit; very large numbers of
  project descriptions could exhaust it
- Strings longer than 300 characters are not sent to DeepL to avoid
  exceeding the per-request limit; long descriptions remain in English

## References

- [i18next documentation](https://www.i18next.com)
- [react-i18next documentation](https://react.i18next.com)
- [DeepL API documentation](https://www.deepl.com/docs-api)
- [i18n-flow.md](../i18n-flow.md) — sequence diagram of the language-switch flow
- [REFRESH.md](../../REFRESH.md) — how the fetch step and DeepL translation run
- `src/i18n.js` — i18next configuration
- `scripts/lib/translation/translate.js` — DeepL integration and cache logic
