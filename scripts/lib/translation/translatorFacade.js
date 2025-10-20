#!/usr/bin/env node
const orchestrator = require('./translationOrchestrator');

async function translateNode(node, translateWithCache, shouldTranslateUI) {
  if (!node) return node;
  try {
    await orchestrator.translateTitlesBatch(node, translateWithCache, shouldTranslateUI);
  } catch (e) { if (process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true') console.log('translateNode error', e && e.message); }
  return node;
}

module.exports = { translateNode };
