const { flattenNodeText, extractTextFromListItem } = require('./helpers');

function normalize(raw) {
  if (!raw) return null;
  let token = String(raw).trim().replace(/^Also[:\s]+/i, '').trim();
  const p = token.indexOf('(');
  if (p !== -1) token = token.slice(0, p).trim();
  const strip = new Set(['-', ':', '(', ')', '[', ']', '"', "'", ',', '.', ';']);
  while (token.length && (token[0].trim() === '' || strip.has(token[0]))) token = token.slice(1);
  while (token.length && (token[token.length - 1].trim() === '' || strip.has(token[token.length - 1]))) token = token.slice(0, -1);
  return token.trim() || null;
}

function findTechSectionBounds(ast) {
  if (!ast || !Array.isArray(ast.children)) return null;
  for (let i = 0; i < ast.children.length; i++) {
    const el = ast.children[i];
    if (el.type === 'heading' && /technolog|tech|stack/i.test((el.children || []).map(c => c.value || '').join(''))) {
      return { startIdx: i + 1, depth: el.depth || 2 };
    }
  }
  return null;
}

function collectBoldTokens(ast, startIdx, depth) {
  const techs = [];
  for (let j = startIdx; j < ast.children.length; j++) {
    const nn = ast.children[j];
    if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= depth) break;
    if (nn.type === 'list' && nn.children) {
      for (const li of nn.children) {
        for (const m of Array.from(String(extractTextFromListItem(li)).matchAll(/\*\*([^*]+?)\*\*/g))) {
          const token = normalize((m && m[1]) ? String(m[1]).trim() : '');
          if (token) techs.push(token);
        }
      }
    }
    if (nn.type === 'paragraph') {
      for (const m of Array.from(String(flattenNodeText(nn).trim()).matchAll(/\*\*([^*]+?)\*\*/g))) {
        const token = normalize((m && m[1]) ? String(m[1]).trim() : '');
        if (token) techs.push(token);
      }
    }
  }
  return techs;
}

function collectLegacyTokens(ast, startIdx, depth) {
  const legacy = [];
  for (let j = startIdx; j < ast.children.length; j++) {
    const nn = ast.children[j];
    if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= depth) break;
    if (nn.type === 'list' && nn.children) {
      for (const li of nn.children) {
        const txt = extractTextFromListItem(li);
        if (txt && txt.includes(',')) txt.split(',').map(s => s.trim()).filter(Boolean).forEach(x => legacy.push(x));
        else if (txt) legacy.push(txt.trim());
      }
    }
    if (nn.type === 'paragraph') {
      const p = flattenNodeText(nn).trim();
      if (p && p.includes(',')) p.split(',').map(s => s.trim()).filter(Boolean).forEach(x => legacy.push(x));
      else if (p && p.length > 0 && !/^(<|!|#)/.test(p)) legacy.push(p.replace(/^Also[:\s]+/i, '').trim());
    }
  }
  return legacy.filter(Boolean).map(s => normalize(s)).filter(Boolean);
}

function extractTechnologiesFromAst(ast) {
  try {
    const bounds = findTechSectionBounds(ast);
    if (!bounds) return [];
    const bold = collectBoldTokens(ast, bounds.startIdx, bounds.depth);
    if (bold.length > 0) return bold.filter(Boolean);
    return collectLegacyTokens(ast, bounds.startIdx, bounds.depth);
  } catch (e) { return []; }
}

module.exports = { extractTechnologiesFromAst };
