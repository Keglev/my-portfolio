// Orchestrates finding a README image candidate, attempting explicit paths,
// downloading a deterministic filename via mediaDownloader and updating node
// (primaryImage, _imageSelection, and README rewrites).
async function processNodeMedia(node, mediaRoot, getAxios, opts = {}) {
  const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
  const parseReadme = opts.parseReadme || require('../parseReadme');
  const isBadgeLike = opts.isBadgeLike || (u => false);
  const mediaDownloader = opts.mediaDownloader || require('../media/mediaDownloader');
  const readme = opts.readme || (node.object && node.object.text) || '';
  const ast = opts.ast || (readme ? (parseReadme.parseMarkdown ? parseReadme.parseMarkdown(readme) : null) : null);

  try {
    // ensure media root exists
    try { mediaDownloader.ensureDir(mediaRoot); } catch (e) {}

    // candidate image
    let candidate = null;
    // prefer explicit project-image path if available on main/master
    const explicitPaths = [`https://raw.githubusercontent.com/keglev/${node.name}/main/src/assets/imgs/project-image.png`, `https://raw.githubusercontent.com/keglev/${node.name}/master/src/assets/imgs/project-image.png`];
    for (const p of explicitPaths) {
      try {
        const ax = getAxios(); if (!ax) continue;
        const h = await ax.head(p, { maxRedirects: 5, timeout: 4000 });
        const ct = (h.headers['content-type']||'').toLowerCase();
        if (h.status === 200 && /^image\//.test(ct)) { candidate = p; node._imageSelection = { original: 'src/assets/imgs/project-image.png', chosenUrl: p, reason: 'explicit-project-image' }; break; }
      } catch (e) { /* ignore */ }
    }

  if (!candidate) candidate = (parseReadme.findImageCandidateFromAst && typeof parseReadme.findImageCandidateFromAst === 'function') ? parseReadme.findImageCandidateFromAst(ast) : null;
  if (DEBUG_FETCH) try { console.log('DEBUG processNodeMedia candidate after AST parse:', candidate); } catch(e){}
    if (!candidate) {
      const re = /!\[[^\]]*\]\(([^)]+)\)/g; const m = re.exec(readme); if (m) candidate = m && m[1] ? m[1].trim() : null;
    }

  if (!candidate) { if (DEBUG_FETCH) try { console.log('DEBUG processNodeMedia no candidate found, readme snippet:', String(readme).slice(0,200)); } catch(e){}; return null; }

    // sanitize candidate (remove title or angle brackets)
    let img = candidate;
    const sp = img.indexOf(' '); if (sp !== -1 && !img.startsWith('<')) img = img.slice(0, sp);
    if (img.startsWith('<') && img.endsWith('>')) img = img.slice(1, -1);

    const absoluteCandidates = /^https?:\/\//i.test(img) ? [img] : [ `https://raw.githubusercontent.com/keglev/${node.name}/main/${img.replace(/^\.\/?/, '')}`, `https://raw.githubusercontent.com/keglev/${node.name}/master/${img.replace(/^\.\/?/, '')}` ];
    if (DEBUG_FETCH) try { console.log('DEBUG processNodeMedia absoluteCandidates:', absoluteCandidates); } catch(e){}
    for (const u of absoluteCandidates) {
      try {
  if (DEBUG_FETCH) try { console.log('DEBUG processNodeMedia attempting downloadIfNeeded for', u); } catch(e){}
  if (DEBUG_FETCH) try { console.log('DEBUG type of mediaDownloader.downloadIfNeeded', typeof (mediaDownloader && mediaDownloader.downloadIfNeeded)); } catch(e){}
  const fn = await mediaDownloader.downloadIfNeeded(node.name, u, { originalCandidate: candidate });
  if (DEBUG_FETCH) try { console.log('DEBUG processNodeMedia raw fn returned:', fn); } catch(e){}
  if (fn) {
          if (DEBUG_FETCH) try { console.log('DEBUG processNodeMedia downloadIfNeeded returned', fn); } catch(e){}
          try { node._imageSelection = node._imageSelection || {}; node._imageSelection.chosenUrl = u; node._imageSelection.filename = fn; node._imageSelection.reason = node._imageSelection.reason || 'downloaded'; } catch (e) {}
          node.primaryImage = `/projects_media/${node.name}/${fn}`;
          // Replace the specific candidate occurrence with the primaryImage in README text
          try { node.object.text = node.object.text.split(candidate).join(node.primaryImage); } catch (e) {}
          // Additionally, rewrite any badge-like or SVG image references in the README to use the chosen primary image
          try {
            const pi = node.primaryImage;
            if (pi && typeof node.object.text === 'string') {
              node.object.text = node.object.text.replace(/!\[[^\]]*\]\((https?:\/\/[^)]+\.(svg))\)/gi, `![$1](${pi}`);
              node.object.text = node.object.text.replace(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi, (m, p1) => {
                if (isBadgeLike(p1) || /\.svg$/i.test(p1)) return `![](${pi})`;
                return m;
              });
              node.object.text = node.object.text.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (m, src) => {
                if (isBadgeLike(src) || /\.svg$/i.test(src)) return `<img src="${pi}" />`;
                return m;
              });
            }
          } catch (e) {}
          return fn;
        }
      } catch (e) { /* ignore and try next candidate */ }
    }
  } catch (e) { if (process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true') console.log('processNodeMedia error', e && e.message); }
  return null;
}

module.exports = { processNodeMedia };
