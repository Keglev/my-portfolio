#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const parseReadme = require('../parseReadme');
const mediaDownloader = require('../media/mediaDownloader');
const mediaHelper = require('../media');
const { fetchReadmeFromRaw } = require('./readmeFallback');

async function processNodeReadme(node, mediaRoot, getAxios, opts = {}) {
  try {
    // ensure readme exists (fallback to raw)
    if (!node.object || !node.object.text) {
      const r = await fetchReadmeFromRaw('keglev', node.name);
      if (r) {
        node.object = node.object || {};
        node.object.text = r;
      }
    }

    const readme = node.object && node.object.text;
    if (!readme || typeof readme !== 'string') return node;

    // parse README into AST
    let ast = null;
    try { ast = parseReadme.parseMarkdown(readme); } catch (e) { ast = null; }
    try { node._ast = ast; } catch (e) { }

    // delegate media processing
    try {
      await mediaHelper.processNodeMedia(node, mediaRoot, getAxios, Object.assign({ parseReadme, isBadgeLike: parseReadme.isBadgeLike, mediaDownloader, readme, ast }, opts));
    } catch (e) { /* swallow - caller may log via DEBUG_FETCH */ }

    // technologies and docs extraction from AST
    try { node.technologies = parseReadme.extractTechnologiesFromAst(ast); } catch (e) { node.technologies = []; }
    try {
      const docs = parseReadme.extractDocsFromAst(ast, node.name) || { documentation: null, apiDocumentation: null, legacy: { docsLink: null, docsTitle: null } };
      node.docs = { documentation: docs.documentation, apiDocumentation: docs.apiDocumentation };
      node.docsLink = (docs.legacy && docs.legacy.docsLink) || null;
      node.docsTitle = (docs.legacy && docs.legacy.docsTitle) || null;
    } catch (e) { node.docs = { documentation: null, apiDocumentation: null }; node.docsLink = null; node.docsTitle = null; }

    // persist meta.json for this repo
    try {
      const mediaDir = path.join(mediaRoot, node.name);
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
      try { fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8'); } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }

    return node;
  } catch (err) {
    // never throw — keep fetch pipeline robust
    return node;
  }
}

module.exports = { processNodeReadme };
