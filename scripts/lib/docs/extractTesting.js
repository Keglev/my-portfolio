const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

function findCoverageInAst(ast, ctx) {
  const links = [];
  if (!ast || !Array.isArray(ast.children)) return links;
  for (const n of ast.children) {
    if (n.type === 'paragraph') {
      for (const ch of (n.children || [])) {
        if (ch.type !== 'link' || !ch.url) continue;
        const label = (ch.children || []).map(c => c.value || '').join('').trim();
        if (!/Test\s+Coverage/i.test(label)) continue;
        const desc = (n.children || []).filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
        links.push({ title: label || 'Test Coverage', link: ch.url, description: ctx.strip(desc) });
      }
    }
    if (n.type === 'list') {
      for (const li of (n.children || [])) {
        const flat = String(ctx.parseReadme.flattenNodeText(li || ''));
        for (const m of flat.matchAll(/\[([^\]]*Test\s+Coverage[^\]]*)\]\(([^)]+)\)/ig)) {
          links.push({ title: (m[1] || 'Test Coverage').trim(), link: (m[2] || '').trim(), description: '' });
        }
      }
    }
  }
  return links;
}

/**
 * Finds "Test Coverage" links in the README. Scans AST nodes first, then falls
 * back to a raw-text regex. Returns a `{ coverage: [...] }` object or null.
 *
 * @param {object} ast - Parsed README AST
 * @param {string} readmeText - Raw README string (fallback)
 * @param {object} ctx - Shared context: { toRawGithub, parseReadme, strip }
 * @returns {{ coverage: Array }|null}
 */
function extractTestingLinks(ast, readmeText, ctx) {
  try {
    let links = findCoverageInAst(ast, ctx);
    if (links.length === 0) {
      links = [...readmeText.matchAll(/\[([^\]]*Test\s+Coverage[^\]]*)\]\(([^)]+)\)/ig)]
        .map(m => ({ title: (m[1] || 'Test Coverage').trim(), link: (m[2] || '').trim(), description: '' }));
    }
    return links.length > 0 ? { coverage: links } : null;
  } catch (e) {
    if (DEBUG_FETCH) console.log('extractTestingLinks error', e && e.message);
    return null;
  }
}

module.exports = { extractTestingLinks };
