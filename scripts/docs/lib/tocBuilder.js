/**
 * @file tocBuilder.js
 * @module scripts/docs/lib/tocBuilder
 * @summary Builds a sidebar table-of-contents nav list from h2/h3 headings.
 * @enterprise Relies on markedConfig's heading-id injection having already
 * run (buildToc only sees headings that already carry an id attribute), so
 * this must be called on HTML that markedConfig's renderer produced --
 * calling it on raw, unconfigured marked output would find zero ids and
 * always return an empty TOC.
 */

/**
 * Scan rendered HTML for h2/h3 tags with ids, return a <ul> nav list.
 * Returns empty string when fewer than 2 headings are found.
 *
 * @param {string} html
 * @returns {string}
 */
function buildToc(html) {
  const re    = /<h([23])\s[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  const items = [];
  let m;

  while ((m = re.exec(html)) !== null) {
    items.push({ level: parseInt(m[1], 10), id: m[2], text: m[3].replace(/<[^>]+>/g, '') });
  }

  if (items.length < 2) return '';

  const lines = ['<ul class="doc-toc__list">'];
  items.forEach(({ level, id, text }) => {
    lines.push(`  <li${level === 3 ? ' class="toc-h3"' : ''}><a href="#${id}">${text}</a></li>`);
  });
  lines.push('</ul>');
  return lines.join('\n');
}

module.exports = { buildToc };
