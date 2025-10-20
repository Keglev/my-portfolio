#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEDIA_ROOT = path.join(__dirname, '..', '..', 'public', 'projects_media');
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

function ensureDir(dir) {
  try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
}

function md5(text) {
  try { return crypto.createHash('md5').update(String(text || '')).digest('hex'); } catch (e) { return null; }
}

function persistMetaForNode(node) {
  try {
    const mediaDir = path.join(MEDIA_ROOT, node.name);
    ensureDir(mediaDir);
    const metaPath = path.join(mediaDir, 'meta.json');
    let meta = { readmeHash: null, files: [] };
    try { if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || meta; } catch (e) { meta = { readmeHash: null, files: [] }; }
    meta.readmeHash = md5((node.object && node.object.text) || '');
    meta.files = meta.files || [];
    if (node._imageSelection) meta.imageSelection = node._imageSelection;
    if (node.primaryImage) meta.primaryImage = node.primaryImage;
    if (node._summarySource) meta.summarySource = node._summarySource;
    if (node._translation) meta.translation = node._translation;
    try { fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8'); } catch (e) { if (DEBUG_FETCH) console.log('meta write failed for', node.name, e && e.message); }
  } catch (e) { if (DEBUG_FETCH) console.log('persistMetaForNode failed', node && node.name, e && e.message); }
}

module.exports = { persistMetaForNode };
