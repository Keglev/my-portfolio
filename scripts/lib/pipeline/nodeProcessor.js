#!/usr/bin/env node
const path = require('path');

async function processNode(node, services = {}) {
  // services: { getAxios, MEDIA_ROOT, parseReadme, translateWithCache, shouldTranslateUI, DEBUG_FETCH }
  const getAxios = services.getAxios || (() => { try { const _a = require('axios'); return _a && _a.default ? _a.default : _a; } catch (e) { return null; } });
  const MEDIA_ROOT = services.MEDIA_ROOT || path.join(__dirname, '..', '..', 'public', 'projects_media');
  const parseReadme = services.parseReadme || require('../parseReadme');
  const translateWithCache = services.translateWithCache || (require('../translation').translateWithCache);
  const shouldTranslateUI = services.shouldTranslateUI || (require('../translation').shouldTranslateUI);
  const DEBUG_FETCH = typeof services.DEBUG_FETCH !== 'undefined' ? services.DEBUG_FETCH : (process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true');

  try {
    // README handling
    try { const readmeHandler = require('../readme/readmeHandler'); await readmeHandler.processNodeReadme(node, MEDIA_ROOT, getAxios, { DEBUG_FETCH, parseReadme }); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: readmeHandler failed', node && node.name, e && e.message); }

    // detailed repo docs
    try { const { extractRepoDocsDetailed } = require('../docs'); const detailed = await extractRepoDocsDetailed(node.object && node.object.text, node.name); if (detailed) node.repoDocs = detailed; } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: extractRepoDocsDetailed failed', node && node.name, e && e.message); }

    // docs heuristics: backfills
    try { const docsHeur = require('../docs/docsHeuristics'); docsHeur.backfillDocsFromText(node); docsHeur.backfillFromAstHeading(node); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: docs heuristics backfill failed', node && node.name, e && e.message); }

    // summary extraction
    try { const { extractSummaryFromNode } = require('../summary/summaryExtractor'); const s = extractSummaryFromNode(node, parseReadme); node.summary = s.summary || ''; node._summarySource = s.summarySource; node._summaryRaw = s.summaryRaw; } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: summary extraction failed', node && node.name, e && e.message); }

    // post-doc heuristics
    try { const docsHeur = require('../docs/docsHeuristics'); docsHeur.postProcessDocsLinkCandidates(node, DEBUG_FETCH); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: postProcessDocsLinkCandidates failed', node && node.name, e && e.message); }

    // translation
    try {
      node._translation = node._translation || {};
      node._translation.debug = node._translation.debug || {};
      const translator = require('../translation/translatorFacade');
      const beforeBatch = Date.now();
      await translator.translateNode(node, translateWithCache, shouldTranslateUI);
      const took = Date.now() - beforeBatch;
      node._translation.debug.requestMs = took;
      if (DEBUG_FETCH) console.log(`nodeProcessor: translation took ${took}ms for ${node.name}`);
      node._translation.summary = node._translation.summary || { text: null, status: null };
      node._translation.docsTitle = node._translation.docsTitle || { text: null, status: null };
    } catch (e) { node._translation = node._translation || {}; node._translation.error = e && e.message; if (DEBUG_FETCH) console.log('nodeProcessor: translation error', e && e.message); }

    // persist meta
    try { const mediaPersistence = require('../media/persistence'); mediaPersistence.persistMetaForNode(node); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: persistMetaForNode failed', node && node.name, e && e.message); }

    // normalization
    try { const { normalizeRepoDocsLinks } = require('../normalize/normalize'); normalizeRepoDocsLinks(node); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: normalizeRepoDocsLinks failed', node && node.name, e && e.message); }

    // prefer github.io
    try { const { tryGithubIo } = require('../normalize/githubIoPreferer'); if (node.docsLink && /raw\.githubusercontent\.com/i.test(node.docsLink)) { const prefer = await tryGithubIo(node, node.docsLink, getAxios, DEBUG_FETCH); if (prefer) node.docsLink = prefer; } if (node.repoDocs) {
      if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.apiDocumentation.link)) {
        const prefer = await tryGithubIo(node, node.repoDocs.apiDocumentation.link, getAxios, DEBUG_FETCH); if (prefer) node.repoDocs.apiDocumentation.link = prefer;
      }
      if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.architectureOverview.link)) {
        const prefer = await tryGithubIo(node, node.repoDocs.architectureOverview.link, getAxios, DEBUG_FETCH); if (prefer) node.repoDocs.architectureOverview.link = prefer;
      }
      if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && node.repoDocs.testing.testingDocs.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.testing.testingDocs.link)) {
        const prefer = await tryGithubIo(node, node.repoDocs.testing.testingDocs.link, getAxios, DEBUG_FETCH); if (prefer) node.repoDocs.testing.testingDocs.link = prefer;
      }
    } } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: github.io prefer failed', node && node.name, e && e.message); }

    // mediaDownloaded flag
    try { const fs = require('fs'); const mediaDir = path.join(MEDIA_ROOT, node.name); node.mediaDownloaded = fs.existsSync(mediaDir) && fs.readdirSync(mediaDir).filter(f => f !== 'meta.json').length > 0; } catch (e) { node.mediaDownloaded = false; }

  } catch (err) {
    if (process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true') console.log('nodeProcessor: unexpected error', err && err.message);
  }
  return node;
}

module.exports = { processNode };
