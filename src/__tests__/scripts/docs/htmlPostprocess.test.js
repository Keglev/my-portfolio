/**
 * @file htmlPostprocess.test.js
 * @module src/__tests__/scripts/docs/htmlPostprocess
 * @testing scripts/docs/lib/htmlPostprocess.js
 * @description Contract tests for the two post-parse HTML transforms:
 * wrapMermaid (fenced mermaid blocks -> the wrapper structure both the
 * Mermaid CDN and build_mermaid.js look for) and rewriteLinks (.md
 * cross-links -> .html after the pipeline converts every page).
 *
 * Out of scope: whether the resulting wrapper actually renders a diagram,
 * which is Mermaid's concern, and the pre-render pass in build_mermaid.js.
 */
import { wrapMermaid, rewriteLinks } from '../../../../scripts/docs/lib/htmlPostprocess.js';

describe('htmlPostprocess', () => {
  describe('wrapMermaid', () => {
    it('should convert a fenced mermaid code block into the mermaid wrapper structure', () => {
      const html = '<pre><code class="language-mermaid">flowchart LR\n A --> B</code></pre>';

      const out = wrapMermaid(html);

      expect(out).toBe(
        '<div class="mermaid-wrapper"><pre class="mermaid">flowchart LR\n A --> B</pre></div>'
      );
    });

    it('should convert every mermaid block when a page contains more than one', () => {
      const html =
        '<pre><code class="language-mermaid">graph A</code></pre>' +
        '<p>between</p>' +
        '<pre><code class="language-mermaid">graph B</code></pre>';

      const out = wrapMermaid(html);
      const wrappers = out.match(/<div class="mermaid-wrapper">/g);

      expect(wrappers).toHaveLength(2);
      expect(out).toContain('<p>between</p>');
    });

    it('should leave non-mermaid code blocks untouched', () => {
      // The language class is the only discriminator; a JS block must
      // survive verbatim or syntax highlighting breaks.
      const html = '<pre><code class="language-js">const a = 1;</code></pre>';

      const out = wrapMermaid(html);

      expect(out).toBe(html);
    });

    it('should return the HTML unchanged when it contains no code blocks at all', () => {
      const html = '<h2 id="x">X</h2><p>Body text.</p>';

      const out = wrapMermaid(html);

      expect(out).toBe(html);
    });
  });

  describe('rewriteLinks', () => {
    it('should rewrite a .md href to .html when the link has no anchor', () => {
      const html = '<a href="02-constraints.md">Constraints</a>';

      const out = rewriteLinks(html);

      expect(out).toContain('href="02-constraints.html"');
    });

    it('should preserve the anchor when rewriting a .md href that has one', () => {
      // Losing the fragment would silently downgrade every deep link in the
      // docs to a page-top link.
      const html = '<a href="07-deployment.md#concurrency-strategy">Concurrency</a>';

      const out = rewriteLinks(html);

      expect(out).toContain('href="07-deployment.html#concurrency-strategy"');
    });

    it('should rewrite a relative path that traverses directories', () => {
      const html = '<a href="../index.md">Up one level</a>';

      const out = rewriteLinks(html);

      expect(out).toContain('href="../index.html"');
    });

    it('should leave hrefs that do not end in .md untouched', () => {
      const html = '<a href="https://vite.dev/">Vite</a><a href="styles.css">CSS</a>';

      const out = rewriteLinks(html);

      expect(out).toBe(html);
    });

    it('should rewrite every .md href when a page contains several', () => {
      const html =
        '<a href="a.md">A</a><a href="b.md#s">B</a><a href="https://x.test/">X</a>';

      const out = rewriteLinks(html);

      expect(out).toContain('href="a.html"');
      expect(out).toContain('href="b.html#s"');
      expect(out).toContain('href="https://x.test/"');
    });
  });
});
