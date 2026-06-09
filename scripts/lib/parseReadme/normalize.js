/**
 * Strips markdown syntax, URLs, and emoji codes from a heading string and
 * truncates to maxLen. Removes Unicode surrogate pairs (emoji encoded as
 * two code units) which cause JSON serialisation issues in some runtimes.
 *
 * @param {string} t - Raw heading text
 * @param {number} [maxLen=120]
 * @returns {string|null}
 */
function normalizeTitle(t, maxLen = 120) {
  if (!t) return null;
  try {
    let s = String(t || '');
    s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    s = s.replace(/https?:\/\/\S+/g, '');
    // Surrogate pairs represent multi-codepoint emoji; strip them to avoid JSON issues
    s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    s = s.replace(/:[a-z0-9_+-]+:/gi, '');
    s = s.replace(/[*_`>#~]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length > maxLen) s = s.slice(0, maxLen).trim() + '…';
    return s || null;
  } catch (e) { return (t && String(t).slice(0, maxLen)) || null; }
}

/**
 * Strips code blocks, inline code, markdown links, HTML tags, and URLs from
 * a summary string and truncates to maxLen. Also removes Unicode surrogate pairs.
 *
 * @param {string} t - Raw summary text
 * @param {number} [maxLen=400]
 * @returns {string}
 */
function normalizeSummary(t, maxLen = 400) {
  if (!t) return '';
  try {
    let s = String(t || '');
    s = s.replace(/```[\s\S]*?```/g, '');
    s = s.replace(/`([^`]+)`/g, '$1');
    s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    s = s.replace(/<[^>]+>/g, '');
    s = s.replace(/https?:\/\/\S+/g, '');
    // Surrogate pairs represent multi-codepoint emoji; strip them to avoid JSON issues
    s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length > maxLen) s = s.slice(0, maxLen).trim() + '…';
    return s;
  } catch (e) { return (t && String(t).slice(0, maxLen)) || ''; }
}

module.exports = { normalizeTitle, normalizeSummary };
