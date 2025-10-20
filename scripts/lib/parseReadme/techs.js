/**
 * extractTechnologiesFromAst.js
 * -----------------------------
 * Extracts a list of technology tokens from a parsed Markdown AST
 * (the AST shape follows the "mdast" style used by remark/rehype helpers
 * in this project). The extractor prefers strict bolded tokens ("**...**")
 * but falls back to older list/comma-based heuristics for legacy READMEs.
 */
const { flattenNodeText, extractTextFromListItem } = require('./helpers');

/**
 * Extract a deduplicated array of technology tokens from the AST.
 *
 * Strategy:
 * - Find the heading whose text matches /(technolog|tech|stack)/i
 * - Collect tokens inside that heading's section (until a sibling
 *   heading of equal or higher depth).
 * - Prefer tokens wrapped with **bold** on the same line (explicit markers).
 * - If no bold tokens are found, fall back to extracting from list items
 *   and comma-separated paragraphs (legacy behaviour).
 *
 * Returns: string[] (normalized tokens) or [] on error.
 */
/**
 * extractTechnologiesFromAst(ast)
 *
 * Inputs:
 * - ast: an mdast-like Markdown AST (object with `children` array of block nodes)
 *
 * Behavior:
 * - Searches for a heading that matches /(technolog|tech|stack)/i and collects
 *   tokens from the subsequent sibling nodes until a sibling heading of equal
 *   or greater depth is encountered.
 * - Prefers explicit bold tokens (``**token**``) inside lists and paragraphs.
 * - If no bold tokens are found, falls back to a legacy heuristic that
 *   extracts comma-separated tokens from list items and paragraphs.
 *
 * Returns: Array<string> normalized tokens. Returns [] on error or when no
 * tokens are found.
 */
function extractTechnologiesFromAst(ast) {
  try {
    const techs = [];
    // quick sanity check: expect ast.children to be an array of block nodes
    if (!ast || !Array.isArray(ast.children)) return techs;
    // Iterate top-level block nodes to locate a heading that looks like a
    // "Technologies" / "Tech Stack" section. We scan the document's
    // immediate children (block-level nodes) rather than performing a deep
    // traversal because the convention is that the technologies section is a
    // top-level heading followed by lists or paragraphs.
    for (let i = 0; i < ast.children.length; i++) {
      const el = ast.children[i];
      // If this node is a heading whose text matches common technology
      // section titles, we'll collect tokens from the nodes that follow it
      // until we reach a sibling heading of equal or greater depth.
      if (el.type === 'heading' && /technolog|tech|stack/i.test(((el.children||[]).map(c=>c.value||'').join('')||''))) {
        const currentDepth = el.depth || 2;
        let j = i+1;
        while (j < ast.children.length) {
          const nn = ast.children[j];
          if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
          // Only extract bold tokens (strict **...**) from lists and paragraphs
          // For list nodes, flatten each list item and look for bold tokens
          // inside the text. This handles markdown lists like:
          // - **React** + **TypeScript**
          // If the sibling node is a list, iterate its list items and
          // extract flattened text from each list item. We prefer bolded
          // tokens inside list items (e.g., "- **React** + **TypeScript**").
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
          // For paragraph nodes, also prefer bold spans on the same line.
          // Example: "**React** + **TypeScript** for fast dev".
          // Paragraph nodes may express technologies inline (often with
          // bold spans). Prefer bold spans on the same line, e.g.
          // "**React** + **TypeScript** for fast dev".
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
  const results = techs.filter(Boolean);
  // If strict bold extraction found nothing, attempt the legacy heuristic.
  // This preserves compatibility with older READMEs that list technologies
  // as plain list items or comma-separated paragraphs.
    if (results.length === 0) {
      const legacy = [];
      // Legacy fallback: if no bold tokens were found we iterate again and
      // apply older heuristics that extract tokens from plain list items or
      // comma-separated paragraphs. This preserves compatibility with older
      // READMEs.
      for (let i = 0; i < ast.children.length; i++) {
        const el = ast.children[i];
        // Find the same heading as above using the same matching rule.
        if (el.type === 'heading' && /technolog|tech|stack/i.test(((el.children||[]).map(c=>c.value||'').join('')||''))) {
          const currentDepth = el.depth || 2;
          let j = i+1;
          while (j < ast.children.length) {
            const nn = ast.children[j];
            if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
            // When encountering a list in the legacy path, treat each list
            // item as a possible multi-token source. Items containing commas
            // are split; otherwise the whole item is taken as a single token.
            if (nn.type === 'list' && nn.children) {
              for (const li of nn.children) {
                const txt = extractTextFromListItem(li);
                if (txt && txt.includes(',')) {
                  txt.split(',').map(s=>s.trim()).filter(Boolean).forEach(x=>legacy.push(x));
                } else if (txt) legacy.push(txt.trim());
              }
            }
            // Paragraphs are also considered: if they contain comma-separated
            // tokens we split them, otherwise we accept the whole paragraph
            // provided it isn't a markdown admonition or HTML/JS fence.
            if (nn.type === 'paragraph') {
              const p = flattenNodeText(nn).trim();
              if (p && p.includes(',')) p.split(',').map(s=>s.trim()).filter(Boolean).forEach(x=>legacy.push(x));
              else if (p && p.length>0 && !/^(<|!|#)/.test(p)) legacy.push(p.replace(/^Also[:\s]+/i,'').trim());
            }
            j++;
          }
          break;
        }
      }
      return legacy.filter(Boolean).map(s => normalize(s)).filter(Boolean);
    }
    return results;
  } catch (e) { return []; }
}

function normalize(raw) {
  if (!raw) return null;
  let token = String(raw).trim();
  // remove leading 'Also:' or similar accidental prefixes
  token = token.replace(/^Also[:\s]+/i, '').trim();
  const p = token.indexOf('(');
  if (p !== -1) token = token.slice(0, p).trim();
  const stripChars = new Set(['-', ':', '(', ')', '[', ']', '"', "'", ',', '.', ';']);
  while (token.length && (token[0].trim() === '' || stripChars.has(token[0]))) token = token.slice(1);
  while (token.length && (token[token.length - 1].trim() === '' || stripChars.has(token[token.length - 1]))) token = token.slice(0, -1);
  token = token.trim();
  return token || null;
}

module.exports = { extractTechnologiesFromAst };
