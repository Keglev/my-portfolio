const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
const API_PREFIX_RE = /^[•\-*.\s📌📡🚀]*\s*/i;

function isCompleteApiLabel(label) {
  return /^Complete\s+API\b/i.test((label || '').replace(API_PREFIX_RE, '').trim());
}

function findCompleteApiInAst(ast, ctx) {
  if (!ast || !Array.isArray(ast.children)) return null;
  for (const n of ast.children) {
    if (n.type === 'paragraph') {
      for (const ch of (n.children || [])) {
        if (ch.type !== 'link' || !ch.url) continue;
        const label = (ch.children || []).map(c => c.value || '').join('').trim();
        if (!isCompleteApiLabel(label)) continue;
        const desc = (n.children || []).filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
        return { title: label || 'Complete API', link: ch.url, description: ctx.strip(desc) };
      }
    }
    if (n.type === 'list') {
      for (const li of (n.children || [])) {
        const flat = ctx.parseReadme.flattenNodeText(li || '').replace(/\r?\n/g, ' ');
        for (const m of String(flat).matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig)) {
          if (isCompleteApiLabel((m[1] || '').trim())) {
            return { title: (m[1] || '').trim(), link: (m[2] || '').trim(), description: '' };
          }
        }
      }
    }
  }
  return null;
}

function findCompleteApiInText(readmeText) {
  for (const line of readmeText.split(/\r?\n/)) {
    if (/^\s*#{1,6}\s/.test(line)) continue;
    for (const m of line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig)) {
      if (isCompleteApiLabel((m[1] || '').trim())) {
        return { title: (m[1] || '').trim(), link: (m[2] || '').trim(), description: '' };
      }
    }
  }
  return null;
}

function findAnyApiLink(readmeText, toRawGithub) {
  for (const m of readmeText.matchAll(/\[([^\]]*)\]\((https?:\/\/[^)\s]+|\.?\/?[^)\s]+)\)/ig)) {
    const label = (m[1] || '').trim();
    const url = (m[2] || '').trim();
    if (!url) continue;
    if (/api/i.test(label) || /api\.(?:md|html)$/i.test(url) || /src\/(?:main\/)?docs\/.+api/i.test(url)) {
      return { title: label || 'API Documentation', link: toRawGithub(url), description: '' };
    }
  }
  const rawAny = readmeText.match(/https?:\/\/raw\.githubusercontent\.com\/keglev\/[^/]+\/(?:main|master)\/(.+api.+\.(?:md|html))/i);
  if (rawAny) return { title: 'API Documentation', link: toRawGithub(rawAny[0]), description: '' };
  return null;
}

function extractApiDocumentation(ast, readmeText, ctx) {
  try {
    return findCompleteApiInAst(ast, ctx) || findCompleteApiInText(readmeText) || findAnyApiLink(readmeText, ctx.toRawGithub);
  } catch (e) {
    if (DEBUG_FETCH) console.log('extractApiDocumentation error', e && e.message);
    return null;
  }
}

module.exports = { extractApiDocumentation };
