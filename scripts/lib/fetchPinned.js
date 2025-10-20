#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
let axios = null;
function getAxios() {
  if (axios) return axios;
  try { const _a = require('axios'); axios = _a && _a.default ? _a.default : _a; return axios; } catch (e) { axios = null; return null; }
}
const parseReadme = require('./parseReadme');
const fetchGithub = require('./fetchGithub');
const mediaDownloader = require('./media/mediaDownloader');
const translation = require('./translation');
const shouldTranslateUI = translation.shouldTranslateUI;
const translateWithCache = translation.translateWithCache;
const { extractRepoDocsDetailed } = require('./docs');
const isBadgeLike = parseReadme && parseReadme.isBadgeLike ? parseReadme.isBadgeLike : (u => false);

const TOKEN = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

const OUT_PATH = path.join(__dirname, '..', '..', 'public', 'projects.json');
const MEDIA_ROOT = path.join(__dirname, '..', '..', 'public', 'projects_media');

const QUERY = `query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12, types: [REPOSITORY]) { nodes { __typename ... on Repository { name description url } } } } }`;

async function fetchGraphQL() {
  if (!fetchGithub || !fetchGithub.runGraphQL) throw new Error('fetchGithub.runGraphQL not available');
  return fetchGithub.runGraphQL(TOKEN, QUERY, { login: 'keglev' });
}

async function fetchPinned() {
  try {
    const nodes = await fetchGraphQL();
    if (!Array.isArray(nodes)) throw new Error('Invalid response from GraphQL');

    // ensure media root exists
    mediaDownloader.ensureDir(MEDIA_ROOT);

    // filter for repository nodes (pinnedItems can contain other types)
    const repoNodes = nodes.filter(n => n && n.__typename === 'Repository');
    for (const node of repoNodes) {
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
      try {
        const diagEnabled = (process.env.DIAG_README === '1') || DEBUG_FETCH;
        if (diagEnabled && readme && typeof readme === 'string') {
          const mediaDir = path.join(MEDIA_ROOT, node.name);
          mediaDownloader.ensureDir(mediaDir);
          try {
            const target = (process.env.DIAG_README_REPO && process.env.DIAG_README_REPO.trim()) || 'inventory-service';
            if (String(node.name || '').toLowerCase() === String(target).toLowerCase()) {
              if (DEBUG_FETCH) console.log(`DEBUG: would have written raw README for ${node.name} (suppressed)`);
            }
          } catch (e) { if (DEBUG_FETCH) console.log('diag target detect failed', e && e.message); }

          try {
            const suspicious = /\{"type"\s*:\s*"[a-z]+"|"children"\s*:\s*\[/i.test(readme);
            if (suspicious) {
              if (DEBUG_FETCH) console.log(`DEBUG: suspicious README pattern detected for ${node.name} (sample write suppressed)`);
            }
          } catch (e) { if (DEBUG_FETCH) console.log('diag detect failed', e && e.message); }
        }
      } catch (e) { if (DEBUG_FETCH) console.log('diag outer failed', e && e.message); }
      if (!readme || typeof readme !== 'string') continue;

      let ast = null;
      try { ast = parseReadme.parseMarkdown(readme); } catch (e) { ast = null; }
      try { node._ast = ast; } catch (e) { }

      // delegate README media detection and download to media helper
      try {
        const mediaHelper = require('./media');
        await mediaHelper.processNodeMedia(node, MEDIA_ROOT, getAxios, { parseReadme, isBadgeLike, mediaDownloader, readme: node.object && node.object.text, ast: node._ast });
      } catch (e) { if (DEBUG_FETCH) console.log('media helper failed', e && e.message); }

      node.technologies = parseReadme.extractTechnologiesFromAst(ast);

      const docs = parseReadme.extractDocsFromAst(ast, node.name) || { documentation: null, apiDocumentation: null, legacy: { docsLink: null, docsTitle: null } };
      node.docs = { documentation: docs.documentation, apiDocumentation: docs.apiDocumentation };
      node.docsLink = (docs.legacy && docs.legacy.docsLink) || null;
      node.docsTitle = (docs.legacy && docs.legacy.docsTitle) || null;

      try {
        const detailed = await extractRepoDocsDetailed(node.object && node.object.text, node.name);
        if (detailed) {
          node.repoDocs = detailed;
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

      if (!node.repoDocs) {
        try {
          const txt = (node.object && node.object.text) || '';
          const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.\/[^)\s]+|\/[^)\s]+|[^)]+\.md)\)/ig;
          let m;
          while ((m = linkRe.exec(txt)) !== null) {
            const label = (m[1]||'').trim();
            let href = (m[2]||'').trim();
            if (/localhost|127\.0\.0\.1|docker|:/i.test(href)) continue;
            if (/docs?|api|redoc|openapi|swagger|reDoc|documentation|api docs/i.test(label + ' ' + href)) {
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

    // summaries and flags
    for (const node of nodes) {
      const readme = node.object && node.object.text;
      let summary = '';
      let summarySource = null;
      try {
        const astLocal = node._ast || (readme ? parseReadme.parseMarkdown(readme) : null);
        const headingRegexes = [/\babout\b/i, /\bsummary\b/i, /\boverview\b/i, /\bdescription\b/i, /\bintro\b/i, /\bwhat\b/i];
        let sec = null;
        if (astLocal) sec = parseReadme.findSectionText(astLocal, headingRegexes);
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
      const normalizedSummary = parseReadme.normalizeSummary(summary || '');
      node.summary = normalizedSummary || '';
      node._summarySource = summarySource;
      try { node._summaryRaw = (summary || '').slice(0, 800); } catch (e) {}
      const mediaDir = path.join(MEDIA_ROOT, node.name);
      node.mediaDownloaded = fs.existsSync(mediaDir) && fs.readdirSync(mediaDir).filter(f=>f!=='meta.json').length>0;
    }

    // translations and docs heuristics
    for (const node of nodes) {
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
      try {
        if ((!node.docsLink || !node.docsTitle) && node._ast && Array.isArray(node._ast.children)) {
          const heading = node._ast.children.find(c => c && c.type === 'heading' && /doc|api|architectur/i.test((c.children||[]).map(ch=>ch.value||'').join('')));
          if (heading) {
            const titleText = (heading.children||[]).map(ch=>ch.value||'').join(' ').trim() || 'Documentation';
            node.docsTitle = node.docsTitle || titleText;
            node.docsLink = node.docsLink || `https://github.com/keglev/${node.name}/blob/main/README.md`;
          }
        }
      } catch (e) { if (DEBUG_FETCH) console.log('backfill from AST heading failed', node.name, e && e.message); }

      try {
        const txt = (node.object && node.object.text) || '';
        const looksLikeIssue = (u) => !!(u && /github\.com\/.+\/(issues|pulls?)\b/i.test(u));
        const isDocsCandidate = (u) => !!(u && /(?:\/docs\b|\bdocs\/|redoc|openapi|swagger|\/api\/|\.md\b|api\b|documentation)/i.test(u));
        if (node.docsLink && looksLikeIssue(node.docsLink)) {
          if (node.repoDocs) {
            if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && !looksLikeIssue(node.repoDocs.apiDocumentation.link)) {
              node.docsTitle = node.repoDocs.apiDocumentation.title || node.docsTitle;
              node.docsLink = node.repoDocs.apiDocumentation.link;
            } else if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && !looksLikeIssue(node.repoDocs.architectureOverview.link)) {
              node.docsTitle = node.repoDocs.architectureOverview.title || node.docsTitle;
              node.docsLink = node.repoDocs.architectureOverview.link;
            }
          }
          if ((!node.docsLink || looksLikeIssue(node.docsLink)) && node.docs && node.docs.documentation && node.docs.documentation.link && !looksLikeIssue(node.docs.documentation.link)) {
            node.docsTitle = node.docs.documentation.title || node.docsTitle;
            node.docsLink = node.docs.documentation.link;
          }
          if ((!node.docsLink || looksLikeIssue(node.docsLink)) && txt) {
            const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/.+?|\.\/[^)]+)\)/ig;
            let lm;
            while ((lm = linkRe.exec(txt)) !== null) {
              const label = lm[1] || '';
              const href = lm[2] || '';
              if (looksLikeIssue(href)) continue;
              if (isDocsCandidate(href) || isDocsCandidate(label)) {
                node.docsTitle = node.docsTitle || label.trim();
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

      node._translation = node._translation || {};
      node._translation.debug = node._translation.debug || {};
      try {
        const summaryForTranslation = parseReadme.normalizeSummary(node.summary || '');
        const docsTitleForTranslation = parseReadme.normalizeTitle(node.docsTitle || '') || '';
        if (DEBUG_FETCH) { node._translation.debug.summaryInput = (summaryForTranslation||'').slice(0,400); node._translation.debug.docsTitleInput = (docsTitleForTranslation||'').slice(0,200); }
        try {
          if (!node.repoDocs && node.docsLink) {
            node.repoDocs = node.repoDocs || {};
            node.repoDocs.apiDocumentation = node.repoDocs.apiDocumentation || { title: node.docsTitle || 'Documentation', link: node.docsLink, description: '' };
          }
          if (node.repoDocs) {
            if (node.repoDocs.apiDocumentation && !node.repoDocs.apiDocumentation.title) node.repoDocs.apiDocumentation.title = node.docsTitle || 'API Documentation';
            if (node.repoDocs.architectureOverview && !node.repoDocs.architectureOverview.title) node.repoDocs.architectureOverview.title = node.docsTitle || 'Architecture Overview';
          }
        } catch (e) { if (DEBUG_FETCH) console.log('backfill repoDocs from docsLink failed', e && e.message); }

        try {
          const orchestrator = translation.orchestrator || require('./translation/translationOrchestrator');
          const beforeBatch = Date.now();
          await orchestrator.translateTitlesBatch(node, translateWithCache, shouldTranslateUI);
          const took = Date.now() - beforeBatch;
          node._translation.debug.requestMs = took;
          if (DEBUG_FETCH) console.log(`DEBUG: DeepL took ${took}ms for ${node.name}`);
        } catch (e) { if (DEBUG_FETCH) console.log('translation orchestrator failed', e && e.message); }
        node._translation.summary = node._translation.summary || { text: null, status: null };
        node._translation.docsTitle = node._translation.docsTitle || { text: null, status: null };
      } catch (e) { node._translation = node._translation || {}; node._translation.error = e && e.message; if (DEBUG_FETCH) console.log('DEBUG: DeepL error', e && e.message); }
      try { mediaDownloader.persistMetaForNode(node); } catch (e) { if (DEBUG_FETCH) console.log('persist meta post-translation failed', e && e.message); }
    }

    // Final normalization pass
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
          const m = href.match(new RegExp('https?:\\/\\/raw\\.githubusercontent\\.com\\\/(?:[^\\/]+)\\\/(?:[^\\/]+)\\\/(?:main|master)\\\/(?:docs)\\\/(.+)$', 'i'));
          if (!m || !m[1]) return null;
          const afterDocs = m[1].replace(/index\.html$/i, '').replace(/(^\/|\/$)/g, '');
          const candidates = [];
          candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}`);
          candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}/index.html`);
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
            } catch (e) { if (DEBUG_FETCH) console.log('github.io candidate failed', c, e && e.message); }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('tryGithubIo error', e && e.message); }
        return null;
      };

      for (const node of nodes) {
        try {
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

    fs.writeFileSync(OUT_PATH, JSON.stringify(nodes, null, 2), 'utf8');
    console.log('Wrote', OUT_PATH);
  } catch (err) {
    console.error('Failed to fetch pinned repositories:', (err && err.message) || err);
    process.exit(3);
  }
}

module.exports = { fetchPinned };
