const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
const PREFIX_RE = /^[•\-.\s📁📚🏗️🎯🚀]*\s*/i;

function isIndexLabel(label) {
  return /^Index\b/i.test((label || '').replace(PREFIX_RE, '').trim());
}

function scanArchParagraph(nn, ctx) {
  for (const ch of (nn.children || [])) {
    if (ch.type !== 'link' || !ch.url) continue;
    const label = (ch.children || []).map(c => c.value || '').join('').trim();
    if (!isIndexLabel(label)) continue;
    const desc = (nn.children || []).filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
    return { title: label || 'Architecture Overview', link: ctx.toRawGithub(ch.url), description: ctx.strip(desc) };
  }
  return null;
}

function scanArchList(nn, ctx) {
  for (const li of (nn.children || [])) {
    const flat = ctx.parseReadme.flattenNodeText(li || '').replace(/\r?\n/g, ' ');
    for (const m of flat.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig)) {
      if (isIndexLabel((m[1] || '').trim())) {
        return { title: (m[1] || '').trim() || 'Architecture Overview', link: ctx.toRawGithub((m[2] || '').trim()), description: '' };
      }
    }
  }
  return null;
}

/**
 * Finds a link labelled "Index" under an "Architecture Overview" heading in the README.
 * "Index" is the canonical label used for architecture HTML docs in this project's READMEs.
 * Falls back to a raw-text scan when the AST contains no matching heading.
 *
 * @param {object} ast - Parsed README AST
 * @param {string} readmeText - Raw README string (fallback)
 * @param {object} ctx - Shared context: { toRawGithub, parseReadme, strip }
 * @returns {{ title: string, link: string, description: string }|null}
 */
function extractArchitectureOverview(ast, readmeText, ctx) {
  try {
    if (ast && Array.isArray(ast.children)) {
      for (let i = 0; i < ast.children.length; i++) {
        const n = ast.children[i];
        if (n.type !== 'heading' || !/architecture overview/i.test((n.children || []).map(c => c.value || '').join(''))) continue;
        let j = i + 1;
        while (j < ast.children.length && ast.children[j].type !== 'heading') {
          const nn = ast.children[j];
          const found = nn.type === 'paragraph' ? scanArchParagraph(nn, ctx) : nn.type === 'list' ? scanArchList(nn, ctx) : null;
          if (found) return found;
          j++;
        }
      }
    }
    const idx = readmeText.search(/^\s*#{1,6}\s*.*architecture overview.*$/im);
    if (idx !== -1) {
      for (const m of readmeText.slice(idx).matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig)) {
        if (isIndexLabel((m[1] || '').trim())) {
          return { title: (m[1] || '').trim(), link: ctx.toRawGithub((m[2] || '').trim()), description: '' };
        }
      }
    }
  } catch (e) { if (DEBUG_FETCH) console.log('extractArchitectureOverview error', e && e.message); }
  return null;
}

module.exports = { extractArchitectureOverview };
