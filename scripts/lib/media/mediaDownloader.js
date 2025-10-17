const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEDIA_ROOT = path.join(__dirname, '..', '..', 'public', 'projects_media');
const MAX = 2 * 1024 * 1024; // 2 MB
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

function ensureDir(dir) {
  try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
}

function md5(text) {
  try { return crypto.createHash('md5').update(String(text || '')).digest('hex'); } catch (e) { return null; }
}

async function downloadIfNeeded(repoName, url, opts = {}) {
  try {
    if (!url) return null;
    // Lazy-load axios to avoid ESM parse issues during test-time imports
    let axios;
    try { axios = require('axios'); } catch (e) { if (DEBUG_FETCH) console.log('mediaDownloader: axios require failed', e && e.message); }
    const u = String(url).split('?')[0];
    let ext = path.extname(u).toLowerCase();
    if (!ext || ext.length > 6) ext = '.png';
    const safeBase = path.basename(u).replace(/[^a-z0-9._-]/gi, '-').replace(/^-+|-+$/g, '');
    const hash = crypto.createHash('md5').update(String(url)).digest('hex').slice(0, 8);
    const fn = `${safeBase}-${hash}${ext}`;
    const destDir = path.join(MEDIA_ROOT, repoName);
    ensureDir(destDir);
    const outPath = path.join(destDir, fn);
    if (fs.existsSync(outPath)) return fn;
    if (!axios) return null;
    const res = await axios.get(url, { responseType: 'arraybuffer', maxRedirects: 5, timeout: 15000 });
    if (!res || !res.data) return null;
    const buf = Buffer.from(res.data);
    if (buf.length > MAX) return null;
    const ct = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || '';
    if (!/image\//i.test(ct) && !/\.(png|jpe?g|gif|svg)$/i.test(ext)) return null;
    fs.writeFileSync(outPath, buf);
    return fn;
  } catch (e) {
    if (DEBUG_FETCH) console.log('mediaDownloader.downloadIfNeeded failed', url, e && e.message);
    return null;
  }
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

module.exports = { ensureDir, md5, downloadIfNeeded, persistMetaForNode };
