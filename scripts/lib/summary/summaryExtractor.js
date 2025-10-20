#!/usr/bin/env node
// Extract a short summary and metadata from a node's README text/AST
function extractSummaryFromNode(node, parseReadme) {
  const readme = node && node.object && node.object.text;
  let summary = '';
  let summarySource = null;
  try {
    const astLocal = (node && node._ast) || (readme ? parseReadme.parseMarkdown(readme) : null);
    const headingRegexes = [/\babout\b/i, /\bsummary\b/i, /\boverview\b/i, /\bdescription\b/i, /\bintro\b/i, /\bwhat\b/i];
    let sec = null;
    if (astLocal) sec = parseReadme.findSectionText(astLocal, headingRegexes);
    if (!sec && readme) sec = parseReadme.extractSectionWithRegex(readme, headingRegexes);
    if (sec && sec.trim().length > 30) {
      const paras = sec.split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
      summary = paras.length ? paras[0] : sec.replace(/\s+/g, ' ').trim();
      summarySource = 'heading';
    }
  } catch (e) { /* swallow - best-effort */ }

  if (!summary && readme && typeof readme === 'string') {
    const paragraphs = readme.split(/\n\s*\n/).map(p => p.replace(/\r/g, '').trim()).filter(Boolean);
    summary = paragraphs.length > 0 ? paragraphs[0].replace(/\s+/g, ' ').trim() : (readme.replace(/\s+/g, ' ').trim().slice(0, 160));
    summarySource = summarySource || (paragraphs.length > 0 ? 'first-paragraph' : 'raw-truncate');
    if (summary.length > 160) summary = summary.slice(0, 160);
  }

  const normalizedSummary = parseReadme.normalizeSummary(summary || '');
  const summaryRaw = (summary || '').slice(0, 800);
  return { summary: normalizedSummary || '', summarySource, summaryRaw };
}

module.exports = { extractSummaryFromNode };
