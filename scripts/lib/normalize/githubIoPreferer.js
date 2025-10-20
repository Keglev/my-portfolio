#!/usr/bin/env node
// Try to prefer a GitHub Pages (github.io) hosted docs page when a raw.githubusercontent link is provided.
async function tryGithubIo(node, href, getAxios, DEBUG_FETCH) {
  try {
    if (!href) return null;
    const m = href.match(new RegExp('https?://raw.githubusercontent.com/(?:[^/]+)/(?:[^/]+)/(?:main|master)/(?:docs)/(.+)$', 'i'));
    if (!m || !m[1]) return null;
    const afterDocs = m[1].replace(/index\.html$/i, '').replace(/(^\/|\/$)/g, '');
    const candidates = [];
    candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}`);
    candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}/index.html`);
    if (!afterDocs) candidates.unshift(`https://keglev.github.io/${node.name}/`);
    for (const c of candidates) {
      try {
        const ax = getAxios ? getAxios() : null; if (!ax) continue;
        const h = await ax.head(c, { maxRedirects: 5, timeout: 5000 });
        const ct = (h && h.headers && h.headers['content-type']) || '';
        const xfo = (h && h.headers && (h.headers['x-frame-options'] || h.headers['X-Frame-Options'])) || '';
        if (h && h.status === 200 && /html/i.test(ct) && !/deny/i.test(xfo)) {
          if (DEBUG_FETCH) console.log('Prefer github.io for', node.name, href, '->', c, 'headers:', { status: h.status, ct, xfo });
          return c;
        }
      } catch (e) { if (DEBUG_FETCH) console.log('github.io candidate failed', c, e && e.message); }
    }
  } catch (e) { if (DEBUG_FETCH) console.log('tryGithubIo error', e && e.message); }
  return null;
}

module.exports = { tryGithubIo };
