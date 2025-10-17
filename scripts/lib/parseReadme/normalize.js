function normalizeTitle(t, maxLen = 120) {
  if (!t) return null;
  try {
    let s = String(t || '');
    s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    s = s.replace(/https?:\/\/\S+/g, '');
    s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    s = s.replace(/:[a-z0-9_+-]+:/gi, '');
    s = s.replace(/[*_`>#~]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length > maxLen) s = s.slice(0, maxLen).trim() + '…';
    return s || null;
  } catch (e) { return (t && String(t).slice(0, maxLen)) || null; }
}

function normalizeSummary(t, maxLen = 400) {
  if (!t) return '';
  try {
    let s = String(t || '');
    s = s.replace(/```[\s\S]*?```/g, '');
    s = s.replace(/`([^`]+)`/g, '$1');
    s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    s = s.replace(/<[^>]+>/g, '');
    s = s.replace(/https?:\/\/\S+/g, '');
    s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length > maxLen) s = s.slice(0, maxLen).trim() + '…';
    return s;
  } catch (e) { return (t && String(t).slice(0, maxLen)) || ''; }
}

module.exports = { normalizeTitle, normalizeSummary };
