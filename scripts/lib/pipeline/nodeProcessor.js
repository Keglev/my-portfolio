#!/usr/bin/env node
const path = require('path');

function resolveServices(services) {
  return {
    getAxios: services.getAxios || (() => { try { const _a = require('axios'); return _a && _a.default ? _a.default : _a; } catch (e) { return null; } }),
    MEDIA_ROOT: services.MEDIA_ROOT || path.join(__dirname, '..', '..', 'public', 'projects_media'),
    parseReadme: services.parseReadme || require('../parseReadme'),
    translateWithCache: services.translateWithCache || (require('../translation').translateWithCache),
    shouldTranslateUI: services.shouldTranslateUI || (require('../translation').shouldTranslateUI),
    DEBUG_FETCH: typeof services.DEBUG_FETCH !== 'undefined' ? services.DEBUG_FETCH : (process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true'),
  };
}

async function runDocStage(node, svc) {
  const { getAxios, MEDIA_ROOT, parseReadme, DEBUG_FETCH } = svc;
  try { const h = require('../readme/readmeHandler'); await h.processNodeReadme(node, MEDIA_ROOT, getAxios, { DEBUG_FETCH, parseReadme }); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: readmeHandler failed', node && node.name, e && e.message); }
  try { const { extractRepoDocsDetailed } = require('../docs'); const d = await extractRepoDocsDetailed(node.object && node.object.text, node.name); if (d) node.repoDocs = d; } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: extractRepoDocsDetailed failed', node && node.name, e && e.message); }
  try { const dh = require('../docs/docsHeuristics'); dh.backfillDocsFromText(node); dh.backfillFromAstHeading(node); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: docs heuristics backfill failed', node && node.name, e && e.message); }
  try { const { extractSummaryFromNode } = require('../summary/summaryExtractor'); const s = extractSummaryFromNode(node, parseReadme); node.summary = s.summary || ''; node._summarySource = s.summarySource; node._summaryRaw = s.summaryRaw; } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: summary extraction failed', node && node.name, e && e.message); }
  try { const dh = require('../docs/docsHeuristics'); dh.postProcessDocsLinkCandidates(node, DEBUG_FETCH); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: postProcessDocsLinkCandidates failed', node && node.name, e && e.message); }
}

async function runTranslationStage(node, svc) {
  const { translateWithCache, shouldTranslateUI, DEBUG_FETCH } = svc;
  try {
    node._translation = node._translation || {};
    node._translation.debug = node._translation.debug || {};
    const translator = require('../translation/translatorFacade');
    const t0 = Date.now();
    await translator.translateNode(node, translateWithCache, shouldTranslateUI);
    const took = Date.now() - t0;
    node._translation.debug.requestMs = took;
    if (DEBUG_FETCH) console.log(`nodeProcessor: translation took ${took}ms for ${node.name}`);
    node._translation.summary = node._translation.summary || { text: null, status: null };
    node._translation.docsTitle = node._translation.docsTitle || { text: null, status: null };
  } catch (e) {
    node._translation = node._translation || {};
    node._translation.error = e && e.message;
    if (DEBUG_FETCH) console.log('nodeProcessor: translation error', e && e.message);
  }
}

async function runPersistenceStage(node, svc) {
  const { getAxios, MEDIA_ROOT, DEBUG_FETCH } = svc;
  try { const mp = require('../media/persistence'); mp.persistMetaForNode(node); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: persistMetaForNode failed', node && node.name, e && e.message); }
  try { const { normalizeRepoDocsLinks } = require('../normalize/normalize'); normalizeRepoDocsLinks(node); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: normalizeRepoDocsLinks failed', node && node.name, e && e.message); }
  try { const { applyGithubIoToNode } = require('../normalize/githubIoPreferer'); await applyGithubIoToNode(node, getAxios, DEBUG_FETCH); } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor: github.io prefer failed', node && node.name, e && e.message); }
  try { const fs = require('fs'); const dir = path.join(MEDIA_ROOT, node.name); node.mediaDownloaded = fs.existsSync(dir) && fs.readdirSync(dir).filter(f => f !== 'meta.json').length > 0; } catch (e) { node.mediaDownloaded = false; }
}

async function processNode(node, services = {}) {
  const svc = resolveServices(services);
  try {
    await runDocStage(node, svc);
    await runTranslationStage(node, svc);
    await runPersistenceStage(node, svc);
  } catch (err) {
    if (svc.DEBUG_FETCH) console.log('nodeProcessor: unexpected error', err && err.message);
  }
  return node;
}

module.exports = { processNode };
