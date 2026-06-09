/**
 * Probes whether a raw.githubusercontent.com docs URL has a rendered GitHub Pages equivalent.
 * Rejects candidates whose X-Frame-Options header is DENY — those won't embed in the portfolio.
 *
 * @param {object} node - Repository node (name used for logging and URL construction)
 * @param {string} href - raw.githubusercontent.com URL to probe
 * @param {Function} getAxios - Factory returning an axios-like HTTP client
 * @param {boolean} [DEBUG_FETCH] - When true, logs probe attempts and failures
 * @returns {Promise<string|null>} GitHub Pages URL when reachable and embeddable, otherwise null
 */
async function tryGithubIo(node, href, getAxios, DEBUG_FETCH) {
  try {
    if (!href) return null;
    const m = href.match(new RegExp('https?://raw.githubusercontent.com/(?:[^/]+)/(?:[^/]+)/(?:main|master)/(?:docs)/(.+)$', 'i'));
    if (!m || !m[1]) return null;
    const afterDocs = m[1].replace(/index\.html$/i, '').replace(/(^\/|\/$)/g, '');
    const candidates = [`https://keglev.github.io/${node.name}/${afterDocs}`, `https://keglev.github.io/${node.name}/${afterDocs}/index.html`];
    if (!afterDocs) candidates.unshift(`https://keglev.github.io/${node.name}/`);
    for (const c of candidates) {
      try {
        const ax = getAxios ? getAxios() : null; if (!ax) continue;
        const h = await ax.head(c, { maxRedirects: 5, timeout: 5000 });
        const ct = (h && h.headers && h.headers['content-type']) || '';
        const xfo = (h && h.headers && (h.headers['x-frame-options'] || h.headers['X-Frame-Options'])) || '';
        if (h && h.status === 200 && /html/i.test(ct) && !/deny/i.test(xfo)) {
          if (DEBUG_FETCH) console.log('Prefer github.io for', node.name, href, '->', c);
          return c;
        }
      } catch (e) { if (DEBUG_FETCH) console.log('github.io candidate failed', c, e && e.message); }
    }
  } catch (e) { if (DEBUG_FETCH) console.log('tryGithubIo error', e && e.message); }
  return null;
}

/**
 * Replaces raw.githubusercontent.com doc links on a node with their GitHub Pages equivalents
 * whenever tryGithubIo finds an embeddable match. Checks docsLink and all repoDocs link fields.
 *
 * @param {object} node - Repository node to update in place
 * @param {Function} getAxios - Factory returning an axios-like HTTP client
 * @param {boolean} [debug] - Passed through to tryGithubIo for verbose logging
 * @returns {Promise<void>}
 */
async function applyGithubIoToNode(node, getAxios, debug) {
  if (node.docsLink && /raw\.githubusercontent\.com/i.test(node.docsLink)) {
    const p = await tryGithubIo(node, node.docsLink, getAxios, debug);
    if (p) node.docsLink = p;
  }
  if (!node.repoDocs) return;
  const rd = node.repoDocs;
  if (rd.apiDocumentation && rd.apiDocumentation.link && /raw\.githubusercontent\.com/i.test(rd.apiDocumentation.link)) {
    const p = await tryGithubIo(node, rd.apiDocumentation.link, getAxios, debug);
    if (p) rd.apiDocumentation.link = p;
  }
  if (rd.architectureOverview && rd.architectureOverview.link && /raw\.githubusercontent\.com/i.test(rd.architectureOverview.link)) {
    const p = await tryGithubIo(node, rd.architectureOverview.link, getAxios, debug);
    if (p) rd.architectureOverview.link = p;
  }
  if (rd.testing && rd.testing.testingDocs && rd.testing.testingDocs.link && /raw\.githubusercontent\.com/i.test(rd.testing.testingDocs.link)) {
    const p = await tryGithubIo(node, rd.testing.testingDocs.link, getAxios, debug);
    if (p) rd.testing.testingDocs.link = p;
  }
}

module.exports = { tryGithubIo, applyGithubIoToNode };
