const { flattenNodeText, extractLinkFromParagraphNode, extractLinkFromListNode } = require('./helpers');

function extractDocsFromAst(ast, repo) {
  try {
    const docs = { documentation: null, apiDocumentation: null };
    const toRaw = (href) => {
      if (!href) return href;
      if (/^https?:\/\//i.test(href)) return href;
      const p = String(href).trim().replace(/^\.#?\//, '').replace(/^\//, '');
      return repo ? `https://raw.githubusercontent.com/keglev/${repo}/main/${p}` : p;
    };
    if (!ast || !Array.isArray(ast.children)) return docs;
    for (let i = 0; i < ast.children.length; i++) {
      const n = ast.children[i];
      if (n.type === 'heading') {
        const headingText = (flattenNodeText(n) || '').toLowerCase();
        if (/\bdocumentation\b/.test(headingText) && !docs.documentation) {
          const currentDepth = n.depth || 2;
          let k = i+1;
          while (k < ast.children.length) {
            const nn = ast.children[k];
            if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
            if (nn.type === 'paragraph' && nn.children) {
              const found = extractLinkFromParagraphNode(nn);
              if (found) {
                docs.documentation = { title: found.title || 'Documentation', link: toRaw(found.link), description: found.description };
                break;
              }
            }
            if (nn.type === 'list' && nn.children) {
              for (const li of nn.children) {
                const linkChild = (li.children||[]).flatMap(ch => (ch.children||[])).find(c => c && c.type === 'link');
                if (linkChild) {
                  const link = linkChild.url;
                  const desc = (li.children||[]).flatMap(ch => (ch.children||[])).filter(c=>c.type==='text').map(c => c.value).join(' ').trim();
                  docs.documentation = { title: (linkChild.children && linkChild.children[0] && linkChild.children[0].value) || 'Documentation', link: toRaw(link), description: desc };
                  break;
                }
                const extracted = extractLinkFromListNode(li);
                if (extracted && extracted.link) {
                  docs.documentation = { title: extracted.title || 'Documentation', link: toRaw(extracted.link), description: '' };
                  break;
                }
              }
              if (docs.documentation) break;
            }
            k++;
          }
        }

        if (/api documentation|api docs|api documentation hub/i.test(headingText) && !docs.apiDocumentation) {
          const currentDepth = n.depth || 2;
          let k = i+1;
          while (k < ast.children.length) {
            const nn = ast.children[k];
            if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
            if (nn.type === 'paragraph' && nn.children) {
              const found = extractLinkFromParagraphNode(nn);
              if (found) {
                docs.apiDocumentation = { title: found.title || 'API Documentation', link: toRaw(found.link), description: found.description };
                break;
              }
            }
            if (nn.type === 'list' && nn.children) {
              for (const li of nn.children) {
                const linkChild = (li.children||[]).flatMap(ch => (ch.children||[])).find(c => c && c.type === 'link');
                if (linkChild) {
                  const link = linkChild.url;
                  const desc = (li.children||[]).flatMap(ch => (ch.children||[])).filter(c=>c.type==='text').map(c => c.value).join(' ').trim();
                  docs.apiDocumentation = { title: (linkChild.children && linkChild.children[0] && linkChild.children[0].value) || 'API Documentation', link: toRaw(link), description: desc };
                  break;
                }
                const extracted = extractLinkFromListNode(li);
                if (extracted && extracted.link) {
                  const u = extracted.link;
                  if (/api|openapi|swagger|docs?/i.test(u) || /api/i.test(JSON.stringify(li))) {
                    docs.apiDocumentation = { title: extracted.title || 'API Documentation', link: toRaw(u), description: '' };
                    break;
                  }
                  if (!docs.apiDocumentation) docs.apiDocumentation = { title: 'API Documentation', link: toRaw(u), description: '' };
                }
              }
              if (docs.apiDocumentation) break;
            }
            k++;
          }
        }
      }
    }
    if (docs.documentation) docs.legacy = { docsLink: docs.documentation.link, docsTitle: docs.documentation.title };
    else if (docs.apiDocumentation) docs.legacy = { docsLink: docs.apiDocumentation.link, docsTitle: docs.apiDocumentation.title };
    else docs.legacy = { docsLink: null, docsTitle: null };
    return docs;
  } catch (e) { return { documentation: null, apiDocumentation: null, legacy: { docsLink: null, docsTitle: null } }; }
}

module.exports = { extractDocsFromAst };
