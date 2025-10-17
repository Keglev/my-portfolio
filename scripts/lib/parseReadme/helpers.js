// Shared helper utilities for parseReadme extractors
function flattenNodeText(node) {
  try {
    if (!node) return '';
    if (node.type === 'text') return node.value || '';
    if (node.children && Array.isArray(node.children)) {
      const out = node.children.map(flattenNodeText).join('');
      try {
        if (process.env.PARSE_README_TRACE === '1' || process.env.DEBUG_FETCH === 'true' || process.env.DEBUG_FETCH === '1') {
          console.log('TRACE flattenNodeText ->', { nodeType: node.type, sample: String(out).slice(0,200) });
        }
      } catch (e) {}
      return out;
    }
    return node.value || '';
  } catch (e) { return ''; }
}

function extractTextFromListItem(li) {
  try {
    if (!li) return '';
    if (Array.isArray(li.children)) {
      const parts = [];
      for (const ch of li.children) {
        if (!ch) continue;
        if (ch.type === 'paragraph' || ch.type === 'text') parts.push(flattenNodeText(ch));
        else if (ch.children && Array.isArray(ch.children)) parts.push(ch.children.map(flattenNodeText).join(' '));
        else parts.push(flattenNodeText(ch));
      }
      return parts.join(' ').replace(/^\s*[-\s]+/, '').trim();
    }
    return flattenNodeText(li).trim();
  } catch (e) { return ''; }
}

function extractLinkFromParagraphNode(node) {
  if (!node || !Array.isArray(node.children)) return null;
  const linkNode = node.children.find(c => c && c.type === 'link');
  if (linkNode && linkNode.url) {
    const title = (linkNode.children && linkNode.children[0] && linkNode.children[0].value) || null;
    const desc = node.children.filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
    try { if (process.env.PARSE_README_TRACE === '1' || process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true') console.log('TRACE extractLinkFromParagraphNode', { title, link: linkNode.url, desc: String(desc).slice(0,200) }); } catch(e){}
    return { link: linkNode.url, title, description: desc };
  }
  return null;
}

function extractLinkFromListNode(li) {
  try {
    const flat = JSON.stringify(li);
    const mdMatch = flat.match(/\[([^\]]+)\]\(([^)]+)\)/);
    try { if (process.env.PARSE_README_TRACE === '1' || process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true') console.log('TRACE extractLinkFromListNode flat', String(flat).slice(0,300)); } catch(e){}
    if (mdMatch) return { title: mdMatch[1] || null, link: mdMatch[2] || null };
  } catch (e) { /* ignore */ }
  return null;
}

module.exports = { flattenNodeText, extractTextFromListItem, extractLinkFromParagraphNode, extractLinkFromListNode };

function extractSectionWithRegex(text, headingRegexes) {
  if (!text) return null;
  try {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const re of headingRegexes) {
        if (re.test(line)) {
          const parts = [];
          let j = i + 1;
          while (j < lines.length && !/^#{1,6}\s+/.test(lines[j])) {
            if (lines[j].trim()) parts.push(lines[j].trim());
            j++;
          }
          if (parts.length) return parts.join('\n\n');
          return null;
        }
      }
    }
  } catch (e) { }
  return null;
}

function findSectionText(ast, headingRegexes) {
  try {
    if (!ast || !Array.isArray(ast.children)) return null;
    const flatten = flattenNodeText;
    for (let i = 0; i < ast.children.length; i++) {
      const n = ast.children[i];
      if (n.type === 'heading') {
        const headingText = (flatten(n) || '').toLowerCase();
        for (const re of headingRegexes) {
          if (re.test(headingText)) {
            const currentDepth = n.depth || 2;
            let j = i + 1;
            const parts = [];
            while (j < ast.children.length) {
              const nn = ast.children[j];
              if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
              if (nn.type === 'paragraph') {
                const txt = (nn.children||[]).map(c=>c.value||'').join(' ').trim();
                if (txt) parts.push(txt);
              }
              if (nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const txt = (li.children||[]).map(ch => (ch.children||[]).map(cc=>cc.value||'').join(' ') || ch.value || '').join(' ').trim();
                  if (txt) parts.push(txt);
                }
              }
              if (nn.type === 'html' && typeof nn.value === 'string') {
                const cleaned = nn.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g,' ').trim();
                if (cleaned) parts.push(cleaned);
              }
              j++;
            }
            if (parts.length) return parts.join('\n\n');
            return null;
          }
        }
      }
    }
  } catch (e) { }
  return null;
}

module.exports = Object.assign(module.exports, { extractSectionWithRegex, findSectionText });


