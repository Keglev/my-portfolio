#!/usr/bin/env node
// Encapsulate heuristics used to derive docsLink/docsTitle and to backfill from repoDocs
function backfillDocsFromText(node) {
  try {
    if (!node) return node;
    if (!node.docsLink || !node.docsTitle) {
      const txt = node.object && node.object.text;
      if (txt) {
        const m = txt.match(/\[([^\]]*doc[^\]]*)\]\((https?:\/\/[^)\s]+)\)/i);
        if (m) { node.docsTitle = m[1].trim(); node.docsLink = m[2].trim(); return node; }
        const dline = txt.match(/(?:^|\n)\s*documentation[:\s]+(https?:\/\/[^\s]+)/i);
        if (dline) { node.docsTitle = 'Documentation'; node.docsLink = dline[1].trim(); return node; }
      }
    }
  } catch (e) { /* ignore */ }
  return node;
}

function backfillFromAstHeading(node) {
  try {
    if (!node || !node._ast || !Array.isArray(node._ast.children)) return node;
    const heading = node._ast.children.find(c => c && c.type === 'heading' && /doc|api|architectur/i.test((c.children||[]).map(ch=>ch.value||'').join('')));
    if (heading) {
      const titleText = (heading.children||[]).map(ch=>ch.value||'').join(' ').trim() || 'Documentation';
      node.docsTitle = node.docsTitle || titleText;
      node.docsLink = node.docsLink || `https://github.com/keglev/${node.name}/blob/main/README.md`;
    }
  } catch (e) { /* ignore */ }
  return node;
}

function postProcessDocsLinkCandidates(node, DEBUG_FETCH) {
  try {
    const txt = (node.object && node.object.text) || '';
    const looksLikeIssue = (u) => !!(u && /github\.com\/.+\/(issues|pulls?)\b/i.test(u));
    const isDocsCandidate = (u) => !!(u && /(?:\/docs\b|\bdocs\/|redoc|openapi|swagger|\/api\/|\.md\b|api\b|documentation)/i.test(u));
    if (node.docsLink && looksLikeIssue(node.docsLink)) {
      if (node.repoDocs) {
        if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && !looksLikeIssue(node.repoDocs.apiDocumentation.link)) {
          node.docsTitle = node.repoDocs.apiDocumentation.title || node.docsTitle;
          node.docsLink = node.repoDocs.apiDocumentation.link;
        } else if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && !looksLikeIssue(node.repoDocs.architectureOverview.link)) {
          node.docsTitle = node.repoDocs.architectureOverview.title || node.docsTitle;
          node.docsLink = node.repoDocs.architectureOverview.link;
        }
      }
      if ((!node.docsLink || looksLikeIssue(node.docsLink)) && node.docs && node.docs.documentation && node.docs.documentation.link && !looksLikeIssue(node.docs.documentation.link)) {
        node.docsTitle = node.docs.documentation.title || node.docsTitle;
        node.docsLink = node.docs.documentation.link;
      }
      if ((!node.docsLink || looksLikeIssue(node.docsLink)) && txt) {
        const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/.+?|\.\/[^)]+)\)/ig;
        let lm;
        while ((lm = linkRe.exec(txt)) !== null) {
          const label = lm[1] || '';
          const href = lm[2] || '';
          if (looksLikeIssue(href)) continue;
          if (isDocsCandidate(href) || isDocsCandidate(label)) {
            node.docsTitle = node.docsTitle || label.trim();
            if (/^\//.test(href) || /^\.\/?/.test(href)) {
              const cleaned = href.replace(/^\.\//,'').replace(/^\//,'');
              node.docsLink = `https://raw.githubusercontent.com/keglev/${node.name}/main/${cleaned}`;
            } else node.docsLink = href;
            break;
          }
        }
      }
    }
  } catch (e) { if (DEBUG_FETCH) console.log('post-docsLink heuristics failed', e && e.message); }
  return node;
}

module.exports = { backfillDocsFromText, backfillFromAstHeading, postProcessDocsLinkCandidates };
