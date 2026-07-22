/**
 * @file langSwitch.test.js
 * @module src/__tests__/docs/theme/langSwitch
 * @testing docs/_theme/js/docs.js
 * @description Behaviour tests for the docs theme's runtime EN/DE language
 * switch: which pages resolve to a translated twin, and what happens on the
 * pages that have none.
 *
 * The regression this locks down: DE used to point at the German landing on
 * every untranslated page, which silently threw the reader off the page they
 * were on. It must now be disabled instead -- href removed (that is what
 * blocks navigation) AND aria-disabled set (that is what assistive tech
 * reads). Asserting only one of the two would let the other regress.
 *
 * docs.js is a side-effecting browser script with no exports, so it is
 * evaluated as source against a jsdom document rather than imported. It
 * lives outside the coverage include globs (src, scripts, config), so this
 * file adds no measured code and no threshold group.
 */
import fs from 'node:fs';
import path from 'node:path';

const DOCS_JS = fs.readFileSync(
  path.resolve(__dirname, '../../../../docs/_theme/js/docs.js'),
  'utf8'
);

const BASE = '/my-portfolio';

/**
 * Renders the header's language switch, navigates jsdom to `pathname`, and
 * runs docs.js against it.
 *
 * @param {string} pathname - Page path, as location.pathname would report it
 * @returns {{en: HTMLAnchorElement, de: HTMLAnchorElement}}
 */
function runOn(pathname) {
  document.body.innerHTML = `
    <span class="lang-switch">
      <a href="index.html" aria-current="true">EN</a>
      <a href="index-de.html">DE</a>
    </span>`;
  window.history.replaceState({}, '', pathname);

  // new Function, not import: docs.js is a side-effecting browser script
  // with no exports, and its effects are the thing under test.
  new Function(DOCS_JS)();

  const links = document.querySelectorAll('.lang-switch a');
  return { en: links[0], de: links[1] };
}

describe('docs theme language switch', () => {
  describe('pages with a German twin', () => {
    it('should pair the English landing with the German landing', () => {
      const { en, de } = runOn(`${BASE}/`);

      expect(en.getAttribute('href')).toBe(`${BASE}/`);
      expect(de.getAttribute('href')).toBe(`${BASE}/index-de.html`);
      expect(en.getAttribute('aria-current')).toBe('true');
    });

    it('should mark DE as current when the German landing is the page shown', () => {
      const { en, de } = runOn(`${BASE}/index-de.html`);

      expect(de.getAttribute('aria-current')).toBe('true');
      expect(en.getAttribute('aria-current')).toBeNull();
      expect(de.hasAttribute('aria-disabled')).toBe(false);
    });

    it('should pair the English documentation index with its German twin', () => {
      const { de } = runOn(`${BASE}/docs-index.html`);

      expect(de.getAttribute('href')).toBe(`${BASE}/docs-index.de.html`);
      expect(de.hasAttribute('aria-disabled')).toBe(false);
    });

    it('should pair the German documentation index back to the English one', () => {
      const { en, de } = runOn(`${BASE}/docs-index.de.html`);

      expect(en.getAttribute('href')).toBe(`${BASE}/docs-index.html`);
      expect(de.getAttribute('aria-current')).toBe('true');
    });

    it('should pair arc42 chapter 01 with its German twin', () => {
      const { de } = runOn(`${BASE}/architecture/01-introduction-and-goals.html`);

      expect(de.getAttribute('href')).toBe(
        `${BASE}/architecture/01-introduction-and-goals.de.html`
      );
    });

    it('should pair the German chapter 01 back to the English one', () => {
      const { en, de } = runOn(`${BASE}/architecture/01-introduction-and-goals.de.html`);

      expect(en.getAttribute('href')).toBe(
        `${BASE}/architecture/01-introduction-and-goals.html`
      );
      expect(de.getAttribute('aria-current')).toBe('true');
    });
  });

  describe('pages with no German twin', () => {
    it('should disable DE rather than route it anywhere', () => {
      const { en, de } = runOn(`${BASE}/architecture/02-constraints.html`);

      expect(de.hasAttribute('href')).toBe(false);
      expect(de.getAttribute('aria-disabled')).toBe('true');
      expect(de.getAttribute('title')).toBe('Diese Seite ist nur auf Englisch verfügbar');
      expect(en.getAttribute('aria-current')).toBe('true');
    });

    it('should leave EN enabled and pointed at the current page', () => {
      const { en } = runOn(`${BASE}/architecture/09-decisions/ADR-007-vite-migration.html`);

      expect(en.getAttribute('href')).toBe(
        `${BASE}/architecture/09-decisions/ADR-007-vite-migration.html`
      );
      expect(en.hasAttribute('aria-disabled')).toBe(false);
    });

    it('should not mistake a deep section index.html for the site landing', () => {
      const { de } = runOn(`${BASE}/architecture/09-decisions/index.html`);

      expect(de.hasAttribute('href')).toBe(false);
      expect(de.getAttribute('aria-disabled')).toBe('true');
    });
  });
});
