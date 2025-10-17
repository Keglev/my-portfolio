#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
// axios can be ESM-only in node_modules; require at top-level can cause Jest to attempt
// to parse ESM and fail for some test runs. Use a safe lazy require pattern so tests
// that mock axios can provide the mock before this module needs it; otherwise fall
// back to null and functions that need axios should guard against it.
let axios = null;
function getAxios() {
  if (axios) return axios;
  try { const _a = require('axios'); axios = _a && _a.default ? _a.default : _a; return axios; } catch (e) { axios = null; return null; }
}
const parseReadme = require('./lib/parseReadme');
const fetchGithub = require('./lib/fetchGithub');
// use isBadgeLike provided by parseReadme.extractors
const isBadgeLike = parseReadme && parseReadme.isBadgeLike ? parseReadme.isBadgeLike : (u => false);
// README parsing helpers live in `scripts/lib/parseReadme.js` (parseMarkdown, findSectionText, etc.)

// Output path for the client JSON
const OUT_PATH = path.join(__dirname, '..', 'public', 'projects.json');
const MEDIA_ROOT = path.join(__dirname, '..', 'public', 'projects_media');

const TOKEN = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
// NOTE: do not exit at require-time so helper functions can be imported by other scripts.
// The token presence will be checked when running as a script (see bottom guard).

// Small sanitizer to remove accidental embedded AST/JSON fragments from extracted text
// NOTE: sanitization moved into modules that need it (extractReadmeDocs.js) to avoid
// duplicating unused helpers at the top-level of this orchestrator.

// Use a named query that declares a $login variable and fetches the user's pinned repositories; README content will be fetched via raw.githubusercontent per-repo.
// We request __typename and use a minimal inline fragment for Repository fields.
const QUERY = `query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12, types: [REPOSITORY]) { nodes { __typename ... on Repository { name description url } } } } }`;

// Small wrapper to call the fetchGithub runGraphQL helper with our token and query
async function fetchGraphQL() {
  if (!fetchGithub || !fetchGithub.runGraphQL) throw new Error('fetchGithub.runGraphQL not available');
  return fetchGithub.runGraphQL(TOKEN, QUERY, { login: 'keglev' });
}

const mediaDownloader = require('./lib/media/mediaDownloader');

// isBadgeLike is provided by parseReadme.extractors; prefer that implementation to avoid duplication

// All parsing helpers are provided via `parseReadme` (import above).

const translation = require('./lib/translation');
const shouldTranslateUI = translation.shouldTranslateUI;
const translateWithCache = translation.translateWithCache;
const { extractRepoDocsDetailed } = require('./lib/docs');

// extractRepoDocsDetailed moved to scripts/lib/extractReadmeDocs.js

// normalizeTitle and normalizeSummary are provided by `parseReadme`.

async function fetchPinned() {
  try {
    const nodes = await fetchGraphQL();
    if (!Array.isArray(nodes)) throw new Error('Invalid response from GraphQL');

  // ensure media root exists
  mediaDownloader.ensureDir(MEDIA_ROOT);

  // filter for repository nodes (pinnedItems can contain other types)
  const repoNodes = nodes.filter(n => n && n.__typename === 'Repository');
  for (const node of repoNodes) {
      // ensure README available (GraphQL may return blob text)
      if (!node.object || !node.object.text) {
        for (const br of ['main','master']) {
          try {
            const ax = getAxios(); if (!ax) continue;
            const r = await ax.get(`https://raw.githubusercontent.com/keglev/${node.name}/${br}/README.md`, { responseType: 'text', timeout: 8000 });
            if (r && r.status === 200 && r.data) { node.object = node.object || {}; node.object.text = r.data; break; }
          } catch (e) { }
        }
      }

      const readme = node.object && node.object.text;
      // Diagnostic: detect serialized AST/JSON fragments embedded in README and optionally persist sample
      try {
        const diagEnabled = (process.env.DIAG_README === '1') || DEBUG_FETCH;
        if (diagEnabled && readme && typeof readme === 'string') {
          const mediaDir = path.join(MEDIA_ROOT, node.name);
          mediaDownloader.ensureDir(mediaDir);
          // timestamp intentionally not used after removing debug write behavior
          // 1) targeted raw dump for a repo of interest (defaults to 'inventory-service')
          try {
            const target = (process.env.DIAG_README_REPO && process.env.DIAG_README_REPO.trim()) || 'inventory-service';
            if (String(node.name || '').toLowerCase() === String(target).toLowerCase()) {
              // Previously we wrote raw README files to disk here for debugging. That behavior
              // has been removed to avoid persisting potentially sensitive README content.
              if (DEBUG_FETCH) console.log(`DEBUG: would have written raw README for ${node.name} (suppressed)`);
            }
          } catch (e) { if (DEBUG_FETCH) console.log('diag target detect failed', e && e.message); }

          // 2) previous suspicious pattern capture (keeps existing behavior)
          try {
            const suspicious = /\{"type"\s*:\s*"[a-z]+"|"children"\s*:\s*\[/i.test(readme);
            if (suspicious) {
              // Previously we persisted suspicious README samples to disk. Instead, log a concise
              // diagnostic message when DEBUG_FETCH is enabled and avoid writing the raw README.
              if (DEBUG_FETCH) console.log(`DEBUG: suspicious README pattern detected for ${node.name} (sample write suppressed)`);
            }
          } catch (e) { if (DEBUG_FETCH) console.log('diag detect failed', e && e.message); }
        }
      } catch (e) { if (DEBUG_FETCH) console.log('diag outer failed', e && e.message); }
      if (!readme || typeof readme !== 'string') continue;

  // parse AST
  let ast = null;
  try { ast = parseReadme.parseMarkdown(readme); } catch (e) { ast = null; }
  // attach AST for later extraction
  try { node._ast = ast; } catch (e) { /* ignore */ }

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
  if (!candidate) candidate = parseReadme.findImageCandidateFromAst(ast);
      if (!candidate) {
        const re = /!\[[^\]]*\]\(([^)]+)\)/g; const m = re.exec(readme); if (m) candidate = m[1].trim();
      }

      // delegate README media detection and download to media helper
      try {
        const mediaHelper = require('./lib/media');
        await mediaHelper.processNodeMedia(node, MEDIA_ROOT, getAxios, { parseReadme, isBadgeLike, mediaDownloader, readme: node.object && node.object.text, ast: node._ast });
      } catch (e) { if (DEBUG_FETCH) console.log('media helper failed', e && e.message); }

      // technologies
  node.technologies = parseReadme.extractTechnologiesFromAst(ast);

      // docs (AST lightweight extraction)
  const docs = parseReadme.extractDocsFromAst(ast, node.name) || { documentation: null, apiDocumentation: null, legacy: { docsLink: null, docsTitle: null } };
  node.docs = { documentation: docs.documentation, apiDocumentation: docs.apiDocumentation };
  node.docsLink = (docs.legacy && docs.legacy.docsLink) || null;
  node.docsTitle = (docs.legacy && docs.legacy.docsTitle) || null;

  // richer repo docs extraction & translations (user-specified rules)
  try {
    const detailed = await extractRepoDocsDetailed(node.object && node.object.text, node.name);
    if (detailed) {
      node.repoDocs = detailed;
      // Backfill legacy docsLink/docsTitle for older consumers: prefer API docs, then architecture overview
      try {
        if (!node.docsLink || /github\.com\/.+\/(issues|pulls?)\b/i.test(node.docsLink)) {
          if (detailed.apiDocumentation && detailed.apiDocumentation.link) {
            node.docsLink = detailed.apiDocumentation.link;
            node.docsTitle = node.docsTitle || detailed.apiDocumentation.title || node.docsTitle;
          } else if (detailed.architectureOverview && detailed.architectureOverview.link) {
            node.docsLink = detailed.architectureOverview.link;
            node.docsTitle = node.docsTitle || detailed.architectureOverview.title || node.docsTitle;
          }
        }
      } catch (e) { if (DEBUG_FETCH) console.log('backfill docsLink failed for', node.name, e && e.message); }
    }
  } catch (e) { if (DEBUG_FETCH) console.log('extractRepoDocsDetailed failed for', node.name, e && e.message); }

      // Fallback: if detailed extraction found nothing, scan README for any doc-like link patterns
      if (!node.repoDocs) {
        try {
          const txt = (node.object && node.object.text) || '';
          const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.\/[^)\s]+|\/[^)\s]+|[^)]+\.md)\)/ig;
          let m;
          while ((m = linkRe.exec(txt)) !== null) {
            const label = (m[1]||'').trim();
            let href = (m[2]||'').trim();
            // ignore obvious non-doc links
            if (/localhost|127\.0\.0\.1|docker|:/i.test(href)) continue;
            if (/docs?|api|redoc|openapi|swagger|reDoc|documentation|api docs/i.test(label + ' ' + href)) {
              // normalize relative to raw.githubusercontent
              if (!/^https?:\/\//i.test(href)) href = href.replace(/^\.?\//,'').replace(/^\//,'');
              const absolute = /^https?:\/\//i.test(href) ? href : `https://raw.githubusercontent.com/keglev/${node.name}/main/${href}`;
              node.repoDocs = node.repoDocs || {};
              node.repoDocs.apiDocumentation = node.repoDocs.apiDocumentation || { title: label || 'API Documentation', link: absolute, description: '' };
              node.docsLink = node.docsLink || absolute;
              node.docsTitle = node.docsTitle || parseReadme.normalizeTitle(label) || 'Documentation';
              break;
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('fallback README doc-scan failed for', node.name, e && e.message); }
      }
      // persist per-repo meta readmeHash and selection/translation metadata
      try {
    const mediaDir = path.join(MEDIA_ROOT, node.name);
    mediaDownloader.ensureDir(mediaDir);
        const metaPath = path.join(mediaDir, 'meta.json');
        let meta = { readmeHash: null, files: [] };
        try { if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || meta; } catch (e) { meta = { readmeHash: null, files: [] }; }
    const h = mediaDownloader.md5(node.object.text || '');
  meta.readmeHash = h;
  meta.files = meta.files || [];
  if (node._imageSelection) meta.imageSelection = node._imageSelection;
  if (node.primaryImage) meta.primaryImage = node.primaryImage;
  if (node._summarySource) meta.summarySource = node._summarySource;
  if (node._translation) meta.translation = node._translation;
        try { fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8'); } catch (e) { if (DEBUG_FETCH) console.log('meta write failed for', node.name, e && e.message); }
      } catch (e) { if (DEBUG_FETCH) console.log('persist meta error', e && e.message); }
    }

    // summaries and flags - use AST-aware extraction to find About/Summary/Overview sections
    for (const node of nodes) {
      const readme = node.object && node.object.text;
      let summary = '';
      let summarySource = null;
      try {
  const astLocal = node._ast || (readme ? parseReadme.parseMarkdown(readme) : null);
          const headingRegexes = [/\babout\b/i, /\bsummary\b/i, /\boverview\b/i, /\bdescription\b/i, /\bintro\b/i, /\bwhat\b/i];
          let sec = null;
          if (astLocal) sec = parseReadme.findSectionText(astLocal, headingRegexes);
          // fallback to regex-based extractor when AST isn't available or didn't find a section
          if (!sec && readme) sec = parseReadme.extractSectionWithRegex(readme, headingRegexes);
          if (sec && sec.trim().length > 30) {
            const paras = sec.split(/\n\s*\n/).map(p => p.replace(/\s+/g,' ').trim()).filter(Boolean);
            summary = paras.length ? paras[0] : sec.replace(/\s+/g,' ').trim();
            summarySource = 'heading';
          }
      } catch (e) { if (DEBUG_FETCH) console.log('summary AST extract failed for', node.name, e && e.message); }
      if (!summary && readme && typeof readme === 'string') {
        const paragraphs = readme.split(/\n\s*\n/).map(p=>p.replace(/\r/g,'').trim()).filter(Boolean);
        summary = paragraphs.length>0 ? paragraphs[0].replace(/\s+/g,' ').trim() : (readme.replace(/\s+/g,' ').trim().slice(0,160));
        summarySource = summarySource || (paragraphs.length>0 ? 'first-paragraph' : 'raw-truncate');
        if (summary.length>160) summary = summary.slice(0,160);
      }
  // normalize and store summary
  const normalizedSummary = parseReadme.normalizeSummary(summary || '');
  node.summary = normalizedSummary || '';
  node._summarySource = summarySource;
  // keep a short raw excerpt for debugging
  try { node._summaryRaw = (summary || '').slice(0, 800); } catch (e) {}
      const mediaDir = path.join(MEDIA_ROOT, node.name);
      node.mediaDownloaded = fs.existsSync(mediaDir) && fs.readdirSync(mediaDir).filter(f=>f!=='meta.json').length>0;
    }

    // optional DeepL translations and final docs heuristic
    for (const node of nodes) {
      // if docsLink/title are missing, try light-weight extraction from raw text
      if (!node.docsLink || !node.docsTitle) {
        const txt = node.object && node.object.text;
        if (txt) {
          const m = txt.match(/\[([^\]]*doc[^\]]*)\]\((https?:\/\/[^)\s]+)\)/i);
          if (m) { node.docsTitle = m[1].trim(); node.docsLink = m[2].trim(); }
          else {
            const dline = txt.match(/(?:^|\n)\s*documentation[:\s]+(https?:\/\/[^\s]+)/i);
            if (dline) { node.docsTitle = 'Documentation'; node.docsLink = dline[1].trim(); }
          }
        }
      }
      // If we still don't have a docsLink, but the README has a documentation/api heading,
      // create a lightweight link that opens the README on GitHub (blob) so the UI can
      // render a docs link and we can translate the title.
      try {
        if ((!node.docsLink || !node.docsTitle) && node._ast && Array.isArray(node._ast.children)) {
          const heading = node._ast.children.find(c => c && c.type === 'heading' && /doc|api|architectur/i.test((c.children||[]).map(ch=>ch.value||'').join('')));
          if (heading) {
            // derive a friendly title from heading text
            const titleText = (heading.children||[]).map(ch=>ch.value||'').join(' ').trim() || 'Documentation';
            node.docsTitle = node.docsTitle || titleText;
            // link to README on GitHub (blob) so it opens sanely in browser
            node.docsLink = node.docsLink || `https://github.com/keglev/${node.name}/blob/main/README.md`;
          }
        }
      } catch (e) { if (DEBUG_FETCH) console.log('backfill from AST heading failed', node.name, e && e.message); }
      // If the found docs link looks like a GitHub issues/pull link, try to prefer a better docs-like link
      try {
  const txt = (node.object && node.object.text) || '';
        const looksLikeIssue = (u) => !!(u && /github\.com\/.+\/(issues|pulls?)\b/i.test(u));
        const isDocsCandidate = (u) => !!(u && /(?:\/docs\b|\bdocs\/|redoc|openapi|swagger|\/api\/|\.md\b|api\b|documentation)/i.test(u));
        if (node.docsLink && looksLikeIssue(node.docsLink)) {
          // prefer detailed extraction results if available
          if (node.repoDocs) {
            if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && !looksLikeIssue(node.repoDocs.apiDocumentation.link)) {
              node.docsTitle = node.repoDocs.apiDocumentation.title || node.docsTitle;
              node.docsLink = node.repoDocs.apiDocumentation.link;
            } else if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && !looksLikeIssue(node.repoDocs.architectureOverview.link)) {
              node.docsTitle = node.repoDocs.architectureOverview.title || node.docsTitle;
              node.docsLink = node.repoDocs.architectureOverview.link;
            }
          }
          // fallback to docs-like links in lightweight AST docs or raw README
          if ((!node.docsLink || looksLikeIssue(node.docsLink)) && node.docs && node.docs.documentation && node.docs.documentation.link && !looksLikeIssue(node.docs.documentation.link)) {
            node.docsTitle = node.docs.documentation.title || node.docsTitle;
            node.docsLink = node.docs.documentation.link;
          }
          if ((!node.docsLink || looksLikeIssue(node.docsLink)) && txt) {
            // find first markdown link whose href or label looks docs-like and is not an issues link
            const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/.+?|\.\/[^)]+)\)/ig;
            let lm;
            while ((lm = linkRe.exec(txt)) !== null) {
              const label = lm[1] || '';
              const href = lm[2] || '';
              if (looksLikeIssue(href)) continue;
              if (isDocsCandidate(href) || isDocsCandidate(label)) {
                node.docsTitle = node.docsTitle || label.trim();
                // normalize relative links to repository raw if necessary
                if (/^\//.test(href) || /^\.\/?/.test(href)) {
                  const cleaned = href.replace(/^\.\//,'').replace(/^\//,'');
                  node.docsLink = `https://raw.githubusercontent.com/keglev/${node.name}/main/${cleaned}`;
                } else node.docsLink = href;
                break;
              }
            }
          }
        }
      } catch (e) { if (DEBUG_FETCH) console.log('post-docsLink heuristics failed', e && e.message); }
  // translation block: translate short UI strings where applicable. translate module handles missing key.
        node._translation = node._translation || {};
        node._translation.debug = node._translation.debug || {};
        try {
          // normalize short title and summary before translation
          const summaryForTranslation = parseReadme.normalizeSummary(node.summary || '');
          const docsTitleForTranslation = parseReadme.normalizeTitle(node.docsTitle || '') || '';
          if (DEBUG_FETCH) { node._translation.debug.summaryInput = (summaryForTranslation||'').slice(0,400); node._translation.debug.docsTitleInput = (docsTitleForTranslation||'').slice(0,200); }
          // previous timing var removed — timing is handled around the orchestrator call
          // First, ensure we have repoDocs.apiDocumentation when only docsLink/docsTitle exist
          try {
            if (!node.repoDocs && node.docsLink) {
              node.repoDocs = node.repoDocs || {};
              node.repoDocs.apiDocumentation = node.repoDocs.apiDocumentation || { title: node.docsTitle || 'Documentation', link: node.docsLink, description: '' };
            }
            // Also, if repoDocs exists but titles are missing, backfill from docsTitle
            if (node.repoDocs) {
              if (node.repoDocs.apiDocumentation && !node.repoDocs.apiDocumentation.title) node.repoDocs.apiDocumentation.title = node.docsTitle || 'API Documentation';
              if (node.repoDocs.architectureOverview && !node.repoDocs.architectureOverview.title) node.repoDocs.architectureOverview.title = node.docsTitle || 'Architecture Overview';
            }
          } catch (e) { if (DEBUG_FETCH) console.log('backfill repoDocs from docsLink failed', e && e.message); }

          // Batch and apply short UI title translations via helper
          try {
            const orchestrator = translation.orchestrator || require('./lib/translation/translationOrchestrator');
            const beforeBatch = Date.now();
            await orchestrator.translateTitlesBatch(node, translateWithCache, shouldTranslateUI);
            const took = Date.now() - beforeBatch;
            node._translation.debug.requestMs = took;
            if (DEBUG_FETCH) console.log(`DEBUG: DeepL took ${took}ms for ${node.name}`);
          } catch (e) { if (DEBUG_FETCH) console.log('translation orchestrator failed', e && e.message); }
          // attach detailed responses
          // note: detailed responses are not persisted as a full debug payload to avoid using DeepL for long bodies
          node._translation.summary = node._translation.summary || { text: null, status: null };
          node._translation.docsTitle = node._translation.docsTitle || { text: null, status: null };
        } catch (e) {
          node._translation = node._translation || {}; node._translation.error = e && e.message; if (DEBUG_FETCH) console.log('DEBUG: DeepL error', e && e.message);
        }
    // persist meta immediately so translations and docsTitle_de are available on disk
  try { mediaDownloader.persistMetaForNode(node); } catch (e) { if (DEBUG_FETCH) console.log('persist meta post-translation failed', e && e.message); }
    }

    // Final normalization pass: ensure repoDocs links are absolute raw.githubusercontent URLs
    try {
      for (const node of nodes) {
        try {
          const toRaw = (href) => {
            if (!href) return href;
            if (/^https?:\/\//i.test(href)) return href;
            const p = String(href).trim().replace(/^\.\//, '').replace(/^\//, '');
            return `https://raw.githubusercontent.com/keglev/${node.name}/main/${p}`;
          };
          if (node.repoDocs) {
            if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link) {
              node.repoDocs.architectureOverview.link = toRaw(node.repoDocs.architectureOverview.link);
            }
            if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link) {
              node.repoDocs.apiDocumentation.link = toRaw(node.repoDocs.apiDocumentation.link);
            }
            if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && node.repoDocs.testing.testingDocs.link) {
              node.repoDocs.testing.testingDocs.link = toRaw(node.repoDocs.testing.testingDocs.link);
            }
            // backfill legacy docsLink/docsTitle with preference for API docs then architecture overview
            if (!node.docsLink || /github\.com\/.+\/(issues|pulls?)\b/i.test(node.docsLink)) {
              if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link) {
                node.docsLink = node.repoDocs.apiDocumentation.link;
                node.docsTitle = node.docsTitle || node.repoDocs.apiDocumentation.title || node.docsTitle;
              } else if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link) {
                node.docsLink = node.repoDocs.architectureOverview.link;
                node.docsTitle = node.docsTitle || node.repoDocs.architectureOverview.title || node.docsTitle;
              }
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('final normalize failed for', node.name, e && e.message); }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('final normalization pass error', e && e.message); }

    // Post-process: prefer github.io hosted docs pages when raw.githubusercontent links are found
    try {
      const tryGithubIo = async (node, href) => {
        try {
          if (!href) return null;
          const m = href.match(new RegExp('https?:\\/\\/raw\\.githubusercontent\\.com\\/(?:[^\\/]+)\\/(?:[^\\/]+)\\/(?:main|master)\\/docs\\/(.+)$', 'i'));
          if (!m || !m[1]) return null;
          const afterDocs = m[1].replace(/index\.html$/i, '').replace(/(^\/|\/$)/g, '');
          const candidates = [];
          // candidate 1: folder-style
          candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}`);
          // candidate 2: explicit index.html
          candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}/index.html`);
          // candidate 3: root of repo if afterDocs empty
          if (!afterDocs) candidates.unshift(`https://keglev.github.io/${node.name}/`);
          for (const c of candidates) {
            try {
              const ax = getAxios(); if (!ax) continue;
              const h = await ax.head(c, { maxRedirects: 5, timeout: 5000 });
              const ct = (h && h.headers && h.headers['content-type']) || '';
              const xfo = (h && h.headers && (h.headers['x-frame-options'] || h.headers['X-Frame-Options'])) || '';
              if (h && h.status === 200 && /html/i.test(ct) && !/deny/i.test(xfo)) {
                if (DEBUG_FETCH) console.log('Prefer github.io for', node.name, href, '->', c, 'headers:', { status: h.status, ct, xfo });
                return c;
              }
            } catch (e) {
              if (DEBUG_FETCH) console.log('github.io candidate failed', c, e && e.message);
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('tryGithubIo error', e && e.message); }
        return null;
      };

      for (const node of nodes) {
        try {
          // check main docsLink and repoDocs entries
          if (node.docsLink && /raw\.githubusercontent\.com/i.test(node.docsLink)) {
            const prefer = await tryGithubIo(node, node.docsLink);
            if (prefer) node.docsLink = prefer;
          }
          if (node.repoDocs) {
            if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.apiDocumentation.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.apiDocumentation.link);
              if (prefer) node.repoDocs.apiDocumentation.link = prefer;
            }
            if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.architectureOverview.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.architectureOverview.link);
              if (prefer) node.repoDocs.architectureOverview.link = prefer;
            }
            if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && node.repoDocs.testing.testingDocs.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.testing.testingDocs.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.testing.testingDocs.link);
              if (prefer) node.repoDocs.testing.testingDocs.link = prefer;
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('post-process github.io pref failed for', node.name, e && e.message); }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('github.io post-process error', e && e.message); }

    // write output
    fs.writeFileSync(OUT_PATH, JSON.stringify(nodes, null, 2), 'utf8');
    console.log('Wrote', OUT_PATH);
  } catch (err) {
  console.error('Failed to fetch pinned repositories:', (err && err.message) || err);
    process.exit(3);
  }
}

// Only run fetchPinned when the script is executed directly (not when required by tests)
if (require.main === module) {
  if (!TOKEN) {
    console.warn('No GitHub token found in environment. Skipping fetch.');
    process.exit(0);
  }
  fetchPinned().catch(e=>{ console.error('Unhandled error', (e && e.message) || e); process.exit(4); });
}

// Export helpers for unit tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseMarkdown: parseReadme.parseMarkdown,
    extractSectionWithRegex: parseReadme.extractSectionWithRegex,
    normalizeTitle: parseReadme.normalizeTitle,
    normalizeSummary: parseReadme.normalizeSummary,
    findImageCandidateFromAst: parseReadme.findImageCandidateFromAst,
  isBadgeLike: parseReadme.isBadgeLike,
    extractTechnologiesFromAst: parseReadme.extractTechnologiesFromAst,
    extractDocsFromAst: parseReadme.extractDocsFromAst
  };
  // Also export the detailed extractor for debugging/runnable checks
  try { module.exports.extractRepoDocsDetailed = extractRepoDocsDetailed; } catch (e) { /* ignore in some environments */ }
}
