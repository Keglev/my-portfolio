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
          if (nn.type === 'list' && nn.children) {
            for (const li of nn.children) {
              const txt = extractTextFromListItem(li);
              if (txt) techs.push(txt);
            }
          }
          if (nn.type === 'paragraph') {
            const p = flattenNodeText(nn).trim();
            if (p && p.includes(',')) p.split(',').map(s=>s.trim().replace(/^Also[:\s]+/i,'')).filter(Boolean).forEach(x=>techs.push(x));
            else if (p && p.length>0 && !/^(<|!|#)/.test(p)) techs.push(p.replace(/^Also[:\s]+/i,'').trim());
          }
          j++;
        }
        break;
      }
    }
    return techs.filter(Boolean);
  } catch (e) { return []; }
}

module.exports = { extractTechnologiesFromAst };
