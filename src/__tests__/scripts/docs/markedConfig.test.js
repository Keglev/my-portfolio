/**
 * @file markedConfig.test.js
 * @module src/__tests__/scripts/docs/markedConfig
 * @testing scripts/docs/lib/markedConfig.js
 * @description Contract tests for the configured markdown parser: it
 * resolves a usable parse function from marked, and its custom heading
 * renderer injects the slugified ids that tocBuilder and every in-page
 * anchor link depend on.
 *
 * Out of scope: marked's own markdown correctness, and the two
 * process.exit(1) load-failure paths (marked missing / no resolvable parse
 * function). Those run at module load before any export exists, so
 * exercising them would mean re-importing the module under a mocked
 * 'marked' -- which asserts that vi.mock works, not that this module does.
 * They are covered by the build failing loudly in CI if marked is absent.
 */
import { markedFn } from '../../../../scripts/docs/lib/markedConfig.js';

describe('markedConfig', () => {
  describe('markedFn', () => {
    it('should expose a callable parse function when the module loads', () => {
      expect(typeof markedFn).toBe('function');
    });

    it('should render standard markdown to HTML when given a paragraph', () => {
      const html = markedFn('Hello **world**.');

      expect(html).toContain('<strong>world</strong>');
    });
  });

  describe('heading id injection', () => {
    it('should add a lowercased slug id when rendering a simple heading', () => {
      const html = markedFn('## Test Runner');

      expect(html).toContain('id="test-runner"');
    });

    it('should strip punctuation from the id when the heading contains it', () => {
      // Anchors must be URL-safe; punctuation in an id breaks the href.
      const html = markedFn("## What's tested, and what isn't?");

      expect(html).toMatch(/id="whats-tested-and-what-isnt"/);
    });

    it('should decode escaped entities before slugifying so no numeric residue leaks into the id', () => {
      // Regression: marked escapes heading text before the renderer runs, so
      // an apostrophe arrives as "&#39;". Stripping punctuation first removed
      // only "&" and ";" and left "39" behind -- "What's" became "what39s".
      const apostrophe = markedFn("## What's next");
      const ampersand = markedFn('## Risks & Debt');

      expect(apostrophe).toContain('id="whats-next"');
      expect(ampersand).toContain('id="risks-debt"');
      expect(apostrophe).not.toMatch(/id="[^"]*\d/);
      expect(ampersand).not.toMatch(/id="[^"]*amp/);
    });

    it('should collapse whitespace runs into single dashes when slugifying', () => {
      const html = markedFn('## Spaced    Out   Heading');

      expect(html).toContain('id="spaced-out-heading"');
    });

    it('should preserve the heading level when injecting the id', () => {
      const h2 = markedFn('## Level Two');
      const h3 = markedFn('### Level Three');

      expect(h2).toContain('<h2 id="level-two"');
      expect(h3).toContain('<h3 id="level-three"');
    });

    it('should produce ids that match the anchors tocBuilder generates', () => {
      // The contract between these two modules is the id string itself --
      // if slugify changes, every sidebar link silently 404s in-page.
      const html = markedFn('## Reading the coverage report\n\n## Troubleshooting');

      expect(html).toContain('id="reading-the-coverage-report"');
      expect(html).toContain('id="troubleshooting"');
    });
  });
});
