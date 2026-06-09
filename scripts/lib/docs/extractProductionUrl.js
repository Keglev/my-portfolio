const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
const PROD_PREFIX_RE = /^[•\-*.\s📁📚🏗️🎯🚀📌]*\s*/i;

function isProductionLabel(label, paraText) {
  return /^Production\s+URL\b/i.test((label || '').replace(PROD_PREFIX_RE, '').trim())
    || /Production\s+URL\b/i.test(paraText || '');
}

function findProductionInParagraph(nn, ctx) {
  const paraText = (nn.children || []).map(c => c.value || '').join(' ').trim();
  for (const ch of (nn.children || [])) {
    if (ch.type !== 'link' || !ch.url) continue;
    const label = (ch.children || []).map(c => c.value || '').join('').trim();
    if (isProductionLabel(label, paraText)) {
      return { title: label || 'Production URL', link: ch.url, description: ctx.strip(paraText) };
    }
  }
  return null;
}

function findProductionInList(nn, ctx) {
  for (const li of (nn.children || [])) {
    const flat = ctx.parseReadme.flattenNodeText(li || '').replace(/\r?\n/g, ' ');
    for (const m of flat.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig)) {
      if (isProductionLabel((m[1] || '').trim(), flat)) {
        return { title: (m[1] || '').trim(), link: (m[2] || '').trim(), description: '' };
      }
    }
  }
  return null;
}

function findProductionInText(readmeText) {
  for (const line of readmeText.split(/\r?\n/)) {
    if (/^\s*#{1,6}\s/.test(line)) continue;
    for (const m of line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig)) {
      if (isProductionLabel((m[1] || '').trim(), '')) {
        return { title: (m[1] || '').trim(), link: (m[2] || '').trim(), description: '' };
      }
    }
  }
  return null;
}

/**
 * Finds a "Production URL" link in the README. Scans AST paragraph and list nodes,
 * then falls back to a line-by-line text scan. Returns the first match or null.
 *
 * @param {object} ast - Parsed README AST
 * @param {string} readmeText - Raw README string (fallback)
 * @param {object} ctx - Shared context: { toRawGithub, parseReadme, strip }
 * @returns {{ title: string, link: string, description: string }|null}
 */
function extractProductionUrl(ast, readmeText, ctx) {
  try {
    if (ast && Array.isArray(ast.children)) {
      for (const n of ast.children) {
        const found = n.type === 'paragraph' ? findProductionInParagraph(n, ctx)
          : n.type === 'list' ? findProductionInList(n, ctx) : null;
        if (found) return found;
      }
    }
    return findProductionInText(readmeText);
  } catch (e) {
    if (DEBUG_FETCH) console.log('extractProductionUrl error', e && e.message);
    return null;
  }
}

module.exports = { extractProductionUrl };
