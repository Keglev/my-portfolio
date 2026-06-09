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

/**
 * Writes (or merges into) `public/projects_media/<repo>/meta.json` for a repository node.
 * meta.json carries readmeHash, imageSelection, primaryImage, summarySource, and translation
 * so subsequent pipeline runs can detect whether the README changed and skip redundant work.
 *
 * @param {object} node - Enriched repository node (must have at least `node.name`)
 * @returns {void}
 */
function persistMetaForNode(node) {
  try {
    const mediaDir = path.join(MEDIA_ROOT, node.name);
    ensureDir(mediaDir);
    const metaPath = path.join(mediaDir, 'meta.json');
    let meta = { readmeHash: null, files: [] };
    try { if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || meta; } catch (e) { meta = { readmeHash: null, files: [] }; }
    // Update so subsequent runs can detect whether the README changed and skip re-fetching media
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
