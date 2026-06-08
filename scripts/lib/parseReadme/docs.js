const { flattenNodeText, extractLinkFromParagraphNode, extractLinkFromListNode } = require('./helpers');

function toRaw(href, repo) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  const p = String(href).trim().replace(/^\.#?\//, '').replace(/^\//, '');
  return repo ? `https://raw.githubusercontent.com/keglev/${repo}/main/${p}` : p;
}

function extractDocSection(ast, headingRegex, defaultTitle, repo) {
  for (let i = 0; i < ast.children.length; i++) {
    const n = ast.children[i];
    if (n.type !== 'heading' || !headingRegex.test((flattenNodeText(n) || '').toLowerCase())) continue;
    const depth = n.depth || 2;
    for (let k = i + 1; k < ast.children.length; k++) {
      const nn = ast.children[k];
      if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= depth) break;
      if (nn.type === 'paragraph' && nn.children) {
        const found = extractLinkFromParagraphNode(nn);
        if (found) return { title: found.title || defaultTitle, link: toRaw(found.link, repo), description: found.description };
      }
      if (nn.type === 'list' && nn.children) {
        for (const li of nn.children) {
          const linkChild = (li.children || []).flatMap(ch => (ch.children || [])).find(c => c && c.type === 'link');
          if (linkChild) {
            const desc = (li.children || []).flatMap(ch => (ch.children || [])).filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
            return { title: (linkChild.children && linkChild.children[0] && linkChild.children[0].value) || defaultTitle, link: toRaw(linkChild.url, repo), description: desc };
          }
          const extracted = extractLinkFromListNode(li);
          if (extracted && extracted.link) {
            return { title: extracted.title || defaultTitle, link: toRaw(extracted.link, repo), description: '' };
          }
        }
      }
    }
  }
  return null;
}

function extractApiSection(ast, repo) {
  const headingRegex = /api documentation|api docs|api documentation hub/i;
  for (let i = 0; i < ast.children.length; i++) {
    const n = ast.children[i];
    if (n.type !== 'heading' || !headingRegex.test((flattenNodeText(n) || '').toLowerCase())) continue;
    const depth = n.depth || 2;
    for (let k = i + 1; k < ast.children.length; k++) {
      const nn = ast.children[k];
      if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= depth) break;
      if (nn.type === 'paragraph' && nn.children) {
        const found = extractLinkFromParagraphNode(nn);
        if (found) return { title: found.title || 'API Documentation', link: toRaw(found.link, repo), description: found.description };
      }
      if (nn.type === 'list' && nn.children) {
        for (const li of nn.children) {
          const linkChild = (li.children || []).flatMap(ch => (ch.children || [])).find(c => c && c.type === 'link');
          if (linkChild) {
            const desc = (li.children || []).flatMap(ch => (ch.children || [])).filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
            return { title: (linkChild.children && linkChild.children[0] && linkChild.children[0].value) || 'API Documentation', link: toRaw(linkChild.url, repo), description: desc };
          }
          const extracted = extractLinkFromListNode(li);
          if (extracted && extracted.link) {
            const u = extracted.link;
            const flatLi = flattenNodeText(li || '').toLowerCase();
            if (/api|openapi|swagger|docs?/.test(u.toLowerCase()) || /\bapi\b/.test(flatLi)) {
              return { title: extracted.title || 'API Documentation', link: toRaw(u, repo), description: '' };
            }
            return { title: 'API Documentation', link: toRaw(u, repo), description: '' };
          }
        }
      }
    }
  }
  return null;
}

function extractDocsFromAst(ast, repo) {
  try {
    const docs = { documentation: null, apiDocumentation: null };
    if (!ast || !Array.isArray(ast.children)) return docs;
    docs.documentation = extractDocSection(ast, /\bdocumentation\b/, 'Documentation', repo);
    docs.apiDocumentation = extractApiSection(ast, repo);
    if (docs.documentation) docs.legacy = { docsLink: docs.documentation.link, docsTitle: docs.documentation.title };
    else if (docs.apiDocumentation) docs.legacy = { docsLink: docs.apiDocumentation.link, docsTitle: docs.apiDocumentation.title };
    else docs.legacy = { docsLink: null, docsTitle: null };
    return docs;
  } catch (e) { return { documentation: null, apiDocumentation: null, legacy: { docsLink: null, docsTitle: null } }; }
}

module.exports = { extractDocsFromAst };
