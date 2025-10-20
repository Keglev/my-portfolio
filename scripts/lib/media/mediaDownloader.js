const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * mediaDownloader
 * - Persists remote images under `public/projects_media/<repo>/` with a
 *   deterministic filename derived from a sanitized basename + md5(url) suffix.
 * - Enforces a maximum file size (2MB by default) and checks Content-Type to
 *   avoid storing non-image assets.
 */
const MEDIA_ROOT = path.join(__dirname, '..', '..', 'public', 'projects_media');
const MAX = 2 * 1024 * 1024; // 2 MB
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

function ensureDir(dir) {
  try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
}

function md5(text) {
  try { return crypto.createHash('md5').update(String(text || '')).digest('hex'); } catch (e) { return null; }
}

/**
 * downloadIfNeeded(repoName, url, opts)
 * - repoName: GitHub repo name used as the media subfolder
 * - url: absolute URL to download
 * - opts: reserved for future options (currently unused)
 *
 * Returns: filename (relative to repo media dir) when successful, otherwise null.
 */
async function downloadIfNeeded(repoName, url, opts = {}) {
  try {
    if (!url) return null;
    // Lazy-load axios to avoid ESM/require issues in test environments.
    let axios;
    try { axios = require('axios'); } catch (e) { if (DEBUG_FETCH) console.log('mediaDownloader: axios require failed', e && e.message); }
    // Normalize the url (drop querystring for stable filename derivation)
    const u = String(url).split('?')[0];
    let ext = path.extname(u).toLowerCase();
    if (!ext || ext.length > 6) ext = '.png';
    // Create a safe basename and append a short md5 of the original url
    const safeBase = path.basename(u).replace(/[^a-z0-9._-]/gi, '-').replace(/^-+|-+$/g, '');
    const hash = crypto.createHash('md5').update(String(url)).digest('hex').slice(0, 8);
    const fn = `${safeBase}-${hash}${ext}`;
    const destDir = path.join(MEDIA_ROOT, repoName);
    ensureDir(destDir);
    const outPath = path.join(destDir, fn);
    if (fs.existsSync(outPath)) return fn; // already present
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

const persistence = require('./persistence');


module.exports = { ensureDir, md5, downloadIfNeeded, persistMetaForNode: persistence.persistMetaForNode };
