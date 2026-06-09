/**
 * Recursively concatenates all `value` strings in an AST node tree into plain text.
 *
 * @param {object} node - Any AST node
 * @returns {string}
 */
function flattenNodeText(node) {
  try {
    if (!node) return '';
    if (node.type === 'text') return node.value || '';
    if (node.children && Array.isArray(node.children)) return node.children.map(flattenNodeText).join('');
    return node.value || '';
  } catch (e) { return ''; }
}

/**
 * Extracts plain text from a list item node, joining paragraph and child text
 * and stripping the leading bullet character.
 *
 * @param {object} li - AST listItem node
 * @returns {string}
 */
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

/**
 * Returns the first link found in an AST paragraph node, together with any
 * surrounding text as the description.
 *
 * @param {object} node - AST paragraph node
 * @returns {{ link: string, title: string|null, description: string }|null}
 */
function extractLinkFromParagraphNode(node) {
  if (!node || !Array.isArray(node.children)) return null;
  const linkNode = node.children.find(c => c && c.type === 'link');
  if (linkNode && linkNode.url) {
    const title = (linkNode.children && linkNode.children[0] && linkNode.children[0].value) || null;
    const desc = node.children.filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
    return { link: linkNode.url, title, description: desc };
  }
  return null;
}

/**
 * Returns the first link found in an AST list item, checking child nodes first
 * then falling back to a markdown-link regex on the flattened text.
 *
 * @param {object} li - AST listItem node
 * @returns {{ title: string|null, link: string }|null}
 */
function extractLinkFromListNode(li) {
  try {
    if (li && Array.isArray(li.children)) {
      const linkChild = (li.children || []).flatMap(ch => (ch.children || [])).find(c => c && c.type === 'link');
      if (linkChild && linkChild.url) {
        const title = (linkChild.children && linkChild.children[0] && linkChild.children[0].value) || null;
        return { title, link: linkChild.url };
      }
    }
    const flat = flattenNodeText(li || '').replace(/\r?\n/g, ' ');
    const mdMatch = flat.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (mdMatch) return { title: mdMatch[1] || null, link: mdMatch[2] || null };
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Finds the first section under a matching heading using a plain-text regex scan.
 * Used as a fallback when the AST is not available.
 *
 * @param {string} text - Raw README string
 * @param {RegExp[]} headingRegexes - Ordered list of regexes to match heading lines
 * @returns {string|null} Section body text, or null if no heading matched
 */
function extractSectionWithRegex(text, headingRegexes) {
  if (!text) return null;
  try {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const re of headingRegexes) {
        if (re.test(lines[i])) {
          const parts = [];
          let j = i + 1;
          while (j < lines.length && !/^#{1,6}\s+/.test(lines[j])) {
            if (lines[j].trim()) parts.push(lines[j].trim());
            j++;
          }
          return parts.length ? parts.join('\n\n') : null;
        }
      }
    }
  } catch (e) { }
  return null;
}

/**
 * Finds the body text of the first AST heading whose text matches any of the
 * provided regexes. Stops collecting at the next heading of equal or lesser depth.
 *
 * @param {object} ast - Parsed README AST
 * @param {RegExp[]} headingRegexes - Ordered list of regexes to match heading text
 * @returns {string|null} Section body text, or null if no heading matched
 */
function findSectionText(ast, headingRegexes) {
  try {
    if (!ast || !Array.isArray(ast.children)) return null;
    for (let i = 0; i < ast.children.length; i++) {
      const n = ast.children[i];
      if (n.type !== 'heading') continue;
      const headingText = (flattenNodeText(n) || '').toLowerCase();
      for (const re of headingRegexes) {
        if (!re.test(headingText)) continue;
        const depth = n.depth || 2;
        let j = i + 1;
        const parts = [];
        while (j < ast.children.length) {
          const nn = ast.children[j];
          if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= depth) break;
          if (nn.type === 'paragraph') {
            const txt = (nn.children || []).map(c => c.value || '').join(' ').trim();
            if (txt) parts.push(txt);
          }
          if (nn.type === 'list' && Array.isArray(nn.children)) {
            for (const li of nn.children) {
              const txt = (li.children || []).map(ch => (ch.children || []).map(cc => cc.value || '').join(' ') || ch.value || '').join(' ').trim();
              if (txt) parts.push(txt);
            }
          }
          if (nn.type === 'html' && typeof nn.value === 'string') {
            const cleaned = nn.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleaned) parts.push(cleaned);
          }
          j++;
        }
        return parts.length ? parts.join('\n\n') : null;
      }
    }
  } catch (e) { }
  return null;
}

module.exports = { flattenNodeText, extractTextFromListItem, extractLinkFromParagraphNode, extractLinkFromListNode, extractSectionWithRegex, findSectionText };
