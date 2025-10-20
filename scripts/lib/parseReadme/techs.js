const { flattenNodeText, extractTextFromListItem } = require('./helpers');

function extractTechnologiesFromAst(ast) {
  try {
    const techs = [];
    if (!ast || !Array.isArray(ast.children)) return techs;
    for (let i = 0; i < ast.children.length; i++) {
      const el = ast.children[i];
      if (el.type === 'heading' && /technolog|tech|stack/i.test(((el.children||[]).map(c=>c.value||'').join('')||''))) {
        const currentDepth = el.depth || 2;
        let j = i+1;
        while (j < ast.children.length) {
          const nn = ast.children[j];
          if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
          // Only extract bold tokens (strict **...**) from lists and paragraphs
          if (nn.type === 'list' && nn.children) {
            for (const li of nn.children) {
              const text = extractTextFromListItem(li);
              if (!text) continue;
              // find bold tokens within the flattened list item
              const boldRe = /\*\*([^*]+?)\*\*/g;
              const matches = Array.from(String(text).matchAll(boldRe));
              for (const m of matches) {
                const raw = (m && m[1]) ? String(m[1]).trim() : '';
                const token = normalize(raw);
                if (token) techs.push(token);
              }
            }
          }
          if (nn.type === 'paragraph') {
            const p = flattenNodeText(nn).trim();
            const boldRe = /\*\*([^*]+?)\*\*/g;
            const matches = Array.from(String(p).matchAll(boldRe));
            for (const m of matches) {
              const raw = (m && m[1]) ? String(m[1]).trim() : '';
              const token = normalize(raw);
              if (token) techs.push(token);
            }
          }
          j++;
        }
        break;
      }
    }
    return techs.filter(Boolean);
  } catch (e) { return []; }
}

function normalize(raw) {
  if (!raw) return null;
  let token = String(raw).trim();
  const p = token.indexOf('(');
  if (p !== -1) token = token.slice(0, p).trim();
  const stripChars = new Set(['-', ':', '(', ')', '[', ']', '"', "'", ',', '.', ';']);
  while (token.length && (token[0].trim() === '' || stripChars.has(token[0]))) token = token.slice(1);
  while (token.length && (token[token.length - 1].trim() === '' || stripChars.has(token[token.length - 1]))) token = token.slice(0, -1);
  token = token.trim();
  return token || null;
}

module.exports = { extractTechnologiesFromAst };
