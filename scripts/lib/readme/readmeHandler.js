#!/usr/bin/env node
const parseReadme = require('../parseReadme');
const mediaDownloader = require('../media/mediaDownloader');
const mediaHelper = require('../media');
const { fetchReadmeFromRaw } = require('./readmeFallback');

async function processNodeReadme(node, mediaRoot, getAxios, opts = {}) {
  try {
    if (!node.object || !node.object.text) {
      const r = await fetchReadmeFromRaw('keglev', node.name);
      if (r) { node.object = node.object || {}; node.object.text = r; }
    }

    const readme = node.object && node.object.text;
    if (!readme || typeof readme !== 'string') return node;

    let ast = null;
    try { ast = parseReadme.parseMarkdown(readme); } catch (e) { ast = null; }
    try { node._ast = ast; } catch (e) { }

    try {
      await mediaHelper.processNodeMedia(node, mediaRoot, getAxios, Object.assign({ parseReadme, isBadgeLike: parseReadme.isBadgeLike, mediaDownloader, readme, ast }, opts));
    } catch (e) { /* swallow - caller may log via DEBUG_FETCH */ }

    try { node.technologies = parseReadme.extractTechnologiesFromAst(ast); } catch (e) { node.technologies = []; }
    try {
      const docs = parseReadme.extractDocsFromAst(ast, node.name) || { documentation: null, apiDocumentation: null, legacy: { docsLink: null, docsTitle: null } };
      node.docs = { documentation: docs.documentation, apiDocumentation: docs.apiDocumentation };
      node.docsLink = (docs.legacy && docs.legacy.docsLink) || null;
      node.docsTitle = (docs.legacy && docs.legacy.docsTitle) || null;
    } catch (e) { node.docs = { documentation: null, apiDocumentation: null }; node.docsLink = null; node.docsTitle = null; }

    return node;
  } catch (err) {
    return node;
  }
}

module.exports = { processNodeReadme };
