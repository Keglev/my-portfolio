/**
 * @file htmlPostprocess.js
 * @module scripts/docs/lib/htmlPostprocess
 * @summary Post-processing transforms applied to marked's raw HTML output.
 * @enterprise Both transforms run after marked parses markdown but before
 * the page template is assembled: wrapMermaid prepares fenced mermaid code
 * blocks for client-side (or build_mermaid.js pre-rendered) diagram
 * rendering, and rewriteLinks fixes internal cross-links so
 * href="page.md" still resolves after this pipeline converts every .md
 * file to .html.
 */

/**
 * Convert <pre><code class="language-mermaid">...</code></pre>
 * into <div class="mermaid-wrapper"><pre class="mermaid">...</pre></div>
 * so that mermaid.js picks them up for client-side rendering.
 *
 * @param {string} html
 * @returns {string}
 */
function wrapMermaid(html) {
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) =>
      `<div class="mermaid-wrapper"><pre class="mermaid">${code}</pre></div>`
  );
}

/**
 * Rewrite href="some-file.md" -> href="some-file.html" (with optional #anchor)
 * so internal cross-links work after .md -> .html conversion.
 *
 * @param {string} html
 * @returns {string}
 */
function rewriteLinks(html) {
  return html.replace(
    /href="([^"#]+)\.md(#[^"]*)?">/g,
    (_, file, hash) => `href="${file}.html${hash || ''}">`
  );
}

module.exports = { wrapMermaid, rewriteLinks };
