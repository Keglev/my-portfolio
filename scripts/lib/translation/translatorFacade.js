#!/usr/bin/env node
const orchestrator = require('./translationOrchestrator');

/**
 * Translates all short UI strings on a repository node to German.
 * Delegates to translateTitlesBatch so the caller does not need to know which
 * fields are translatable or how batching works.
 *
 * @param {object} node - Repository node; mutated in place with _de fields
 * @param {Function} translateWithCache - Per-repo cached translation function
 * @param {Function} shouldTranslateUI - Guard that filters strings too long for DeepL
 * @returns {Promise<object>} The same node
 */
async function translateNode(node, translateWithCache, shouldTranslateUI) {
  if (!node) return node;
  try {
    await orchestrator.translateTitlesBatch(node, translateWithCache, shouldTranslateUI);
  } catch (e) { if (process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true') console.log('translateNode error', e && e.message); }
  return node;
}

module.exports = { translateNode };
