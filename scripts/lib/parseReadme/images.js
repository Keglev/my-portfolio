// images.js: focused on image candidate heuristics

function isBadgeLike(u) {
  if (!u) return false;
  const s = String(u).toLowerCase();
  if (s.includes('badge') || s.includes('shield') || s.includes('status') || s.includes('travis') || s.includes('circleci') || s.includes('shields.io') || s.includes('actions/workflows') || s.includes('github.com/badges')) return true;
  return false;
}

function findImageCandidateFromAst(ast) {
  if (!ast || !ast.children) return null;
  const candidates = [];
  const findUnderHeading = (titleRe) => {
    if (!ast || !Array.isArray(ast.children)) return null;
    for (let i = 0; i < ast.children.length; i++) {
      const n = ast.children[i];
      if (n.type === 'heading') {
        const txt = (n.children || []).map(c => c.value || '').join('').toLowerCase();
        if (titleRe.test(txt)) {
          let j = i + 1;
          while (j < ast.children.length && ast.children[j].type !== 'heading') {
            const nn = ast.children[j];
            if (nn.type === 'image' && nn.url) return nn.url;
            if (nn.type === 'html' && typeof nn.value === 'string') {
              const m = nn.value.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);
              if (m && m[1]) return m[1];
            }
            if (nn.children && Array.isArray(nn.children)) {
              // flatten node text instead of serializing the AST
              const helpers = require('./helpers');
              const flat = helpers.flattenNodeText(nn || '').replace(/\r?\n/g,' ');
              const r = flat.match(/https?:\/\/[^"']+|\/.+?\.(png|jpe?g|gif|svg)/i);
              if (r && r[0]) return r[0];
            }
            j++;
          }
        }
      }
    }
    return null;
  };
  const preferred = findUnderHeading(/screenshots|screenshot|images|gallery/i);
  if (preferred) return preferred;

  const isRaster = (u) => /\.(png|jpe?g|gif)$/i.test(u);
  const isLikelyProjectImage = (u) => /project[-_]?image|src\/assets\/imgs|src\/assets|assets\/imgs|assets\/img|project-image/i.test(u);

  const walk = (n) => {
    if (!n) return;
    if (n.type === 'image' && n.url) {
      candidates.push(n.url);
      return;
    }
    if (n.type === 'html' && typeof n.value === 'string') {
      const m = n.value.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);
      if (m && m[1]) candidates.push(m[1]);
    }
    if (n.children && Array.isArray(n.children)) for (const c of n.children) walk(c);
  };
  walk(ast);

  for (const u of candidates) {
    if (isLikelyProjectImage(u) && isRaster(u)) return u;
  }
  for (const u of candidates) {
    if (isRaster(u) && !isBadgeLike(u)) return u;
  }
  for (const u of candidates) {
    if (!/\.svg$/i.test(u) && !isBadgeLike(u)) return u;
  }
  return candidates.length ? candidates[0] : null;
}

module.exports = { findImageCandidateFromAst, isBadgeLike };
