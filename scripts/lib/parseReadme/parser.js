// resilient parser factory: try unified/remark at runtime, but provide a synchronous fallback AST
let parserFactory = null;
try { parserFactory = require('unified'); } catch (e) { parserFactory = null; }

function buildFallbackAst(text) {
  const lines = String(text || '').split(/\r?\n/);
  const children = [];
  let paraBuf = [];
  const flushPara = () => {
    if (paraBuf.length) {
      const text = paraBuf.join(' ').trim();
      const parts = [];
      let lastIndex = 0;
      const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+|\.?\/\/+[^)]+|[^)]+\.md)\)/g;
      let m;
      while ((m = linkRe.exec(text)) !== null) {
        if (m.index > lastIndex) parts.push({ type: 'text', value: text.slice(lastIndex, m.index) });
        parts.push({ type: 'link', url: m[2], children: [{ type: 'text', value: m[1] }] });
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) });
      const childrenNodes = (parts.length ? parts : [{ type: 'text', value: text }]);
      children.push({ type: 'paragraph', children: childrenNodes });
      paraBuf = [];
    }
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = l.match(/^\s*(#{1,6})\s*(.*)$/);
    if (h) {
      flushPara();
      children.push({ type: 'heading', depth: h[1].length, children: [{ type: 'text', value: h[2].trim() }] });
      continue;
    }
    const imgMd = l.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (imgMd) {
      flushPara();
      children.push({ type: 'image', url: imgMd[1].trim(), alt: '' });
      continue;
    }
    const htmlImg = l.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (htmlImg) {
      flushPara();
      children.push({ type: 'html', value: l });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(l)) {
      const listItems = [];
      let j = i;
      while (j < lines.length && /^\s*[-*+]\s+/.test(lines[j])) {
        listItems.push({ type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: lines[j].replace(/^\s*[-*+]\s+/, '').trim() }] }] });
        j++;
      }
      children.push({ type: 'list', children: listItems });
      i = j - 1;
      continue;
    }
    if (l.trim() === '') { flushPara(); continue; }
    paraBuf.push(l.trim());
  }
  flushPara();
  return { type: 'root', children };
}

function parseMarkdown(text) {
  if (!text) return null;
  try {
    if (parserFactory) {
      try {
        const factory = (typeof parserFactory === 'function') ? parserFactory : (parserFactory && parserFactory.default) ? parserFactory.default : null;
        if (factory && typeof factory === 'function') {
          let remarkParse = null;
          try { remarkParse = require('remark-parse'); } catch (e) { remarkParse = null; }
          if (remarkParse) return factory().use(remarkParse).parse(text);
        }
      } catch (e) { /* ignore */ }
    }
    try {
      const remarkPkg = require('remark');
      const remarkFactory = (typeof remarkPkg === 'function') ? remarkPkg : (remarkPkg && remarkPkg.default) ? remarkPkg.default : null;
      let remarkParse = null;
      try { remarkParse = require('remark-parse'); } catch (e) { remarkParse = null; }
      if (remarkFactory && remarkParse) return remarkFactory().use(remarkParse).parse(text);
    } catch (e) { /* ignore */ }
  } catch (e) { /* ignore */ }
  return buildFallbackAst(text);
}

module.exports = { buildFallbackAst, parseMarkdown };
