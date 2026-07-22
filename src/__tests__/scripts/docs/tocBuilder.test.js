/**
 * @file tocBuilder.test.js
 * @module src/__tests__/scripts/docs/tocBuilder
 * @testing scripts/docs/lib/tocBuilder.js
 * @description Contract tests for sidebar TOC generation: which headings
 * are collected, the two-heading suppression threshold, h3 indent marking,
 * and inline-tag stripping in link text.
 *
 * Out of scope: the heading-id injection this module depends on, which is
 * markedConfig's renderer (see markedConfig.test.js). These tests feed
 * hand-written HTML so a change in markedConfig cannot silently mask a
 * regression here.
 */
import { buildToc } from '../../../../scripts/docs/lib/tocBuilder.js';

describe('tocBuilder', () => {
  describe('buildToc', () => {
    it('should return an empty string when the HTML contains no headings', () => {
      const html = '<p>Just a paragraph.</p>';

      const toc = buildToc(html);

      expect(toc).toBe('');
    });

    it('should return an empty string when only one heading is present', () => {
      // A single-heading page has nothing to navigate between, so a
      // one-item sidebar would be noise rather than navigation.
      const html = '<h2 id="alone">Alone</h2>';

      const toc = buildToc(html);

      expect(toc).toBe('');
    });

    it('should build a list item per heading when two or more headings are present', () => {
      const html = '<h2 id="first">First</h2><h2 id="second">Second</h2>';

      const toc = buildToc(html);

      expect(toc).toContain('<ul class="doc-toc__list">');
      expect(toc).toContain('<a href="#first">First</a>');
      expect(toc).toContain('<a href="#second">Second</a>');
      expect(toc).toContain('</ul>');
    });

    it('should mark h3 entries with the toc-h3 class and leave h2 entries unmarked', () => {
      const html = '<h2 id="parent">Parent</h2><h3 id="child">Child</h3>';

      const toc = buildToc(html);

      expect(toc).toContain('<li><a href="#parent">Parent</a></li>');
      expect(toc).toContain('<li class="toc-h3"><a href="#child">Child</a></li>');
    });

    it('should strip inline tags from the heading text when a heading contains markup', () => {
      const html =
        '<h2 id="code-heading">Using <code>buildToc</code></h2>' +
        '<h2 id="plain">Plain</h2>';

      const toc = buildToc(html);

      expect(toc).toContain('<a href="#code-heading">Using buildToc</a>');
      expect(toc).not.toContain('<code>');
    });

    it('should ignore h1 and h4 headings when collecting entries', () => {
      // Only h2/h3 are navigable sections; h1 is the page title and h4 is
      // too granular for a sidebar.
      const html =
        '<h1 id="title">Title</h1>' +
        '<h2 id="section">Section</h2>' +
        '<h3 id="sub">Sub</h3>' +
        '<h4 id="detail">Detail</h4>';

      const toc = buildToc(html);

      expect(toc).toContain('#section');
      expect(toc).toContain('#sub');
      expect(toc).not.toContain('#title');
      expect(toc).not.toContain('#detail');
    });

    it('should skip headings that carry no id attribute when building entries', () => {
      // An id-less heading cannot be linked to, so including it would
      // produce a dead sidebar entry.
      const html =
        '<h2 id="linkable">Linkable</h2>' +
        '<h2>No id here</h2>' +
        '<h2 id="other">Other</h2>';

      const toc = buildToc(html);

      expect(toc).toContain('#linkable');
      expect(toc).toContain('#other');
      expect(toc).not.toContain('No id here');
    });

    it('should preserve document order when headings are interleaved across levels', () => {
      const html =
        '<h2 id="a">A</h2><h3 id="a1">A1</h3><h2 id="b">B</h2>';

      const toc = buildToc(html);
      const order = [toc.indexOf('#a"'), toc.indexOf('#a1'), toc.indexOf('#b')];

      expect(order[0]).toBeLessThan(order[1]);
      expect(order[1]).toBeLessThan(order[2]);
    });
  });
});
