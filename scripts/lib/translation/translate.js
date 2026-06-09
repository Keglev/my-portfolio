const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getAxios } = require('../axiosLoader');
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

/**
 * Sends a single string to the DeepL free-tier API and returns the German translation.
 * Returns `{ text: null, status: 'no-key-or-text' }` when the API key is absent so
 * callers can distinguish a missing key from a network failure.
 *
 * @param {string} text - English text to translate
 * @returns {Promise<{ text: string|null, status: string|number, raw?: object, error?: string }>}
 */
async function translateToGermanDetailed(text) {
  const DEEPL_KEY = process.env.DEEPL_API_KEY || process.env.DEEPL_KEY || process.env.DEEPL_SECRET;
  if (!DEEPL_KEY || !text) return { text: null, status: 'no-key-or-text' };
  try {
    const params = new URLSearchParams();
    params.append('auth_key', DEEPL_KEY);
    params.append('text', text);
    params.append('target_lang', 'DE');
    const ax = getAxios();
    if (!ax) return { text: null, status: 'no-axios' };
    const r = await ax.post('https://api-free.deepl.com/v2/translate', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 });
    const out = (r && r.data && Array.isArray(r.data.translations) && r.data.translations[0] && r.data.translations[0].text) ? r.data.translations[0].text : null;
    if (DEBUG_FETCH) {
      try { console.log('DEBUG: DeepL response status', r && r.status); } catch (e) {}
    }
    return { text: out, status: (r && r.status) || null, raw: r && r.data };
  } catch (e) {
    if (DEBUG_FETCH) console.warn('DeepL failed (detailed):', (e && e.message) || e);
    return { text: null, status: 'error', error: (e && e.message) || String(e) };
  }
}

/**
 * Returns true for strings that are safe to send to DeepL (non-empty, ≤ maxLen chars).
 * Strings longer than maxLen are likely full paragraphs; those are not translated to
 * avoid exceeding the DeepL free-tier per-request limit.
 *
 * @param {string} s
 * @param {number} [maxLen=300]
 * @returns {boolean}
 */
function shouldTranslateUI(s, maxLen = 300) {
  try { return s && typeof s === 'string' && s.trim().length > 0 && s.trim().length <= maxLen; } catch (e) { return false; }
}

const DEFAULT_MEDIA_ROOT = path.join(__dirname, '..', '..', 'public', 'projects_media');
const MEDIA_ROOT = process.env.TRANSLATE_MEDIA_ROOT ? path.resolve(process.env.TRANSLATE_MEDIA_ROOT) : DEFAULT_MEDIA_ROOT;

function _metaPathForRepo(repo) {
  return path.join(MEDIA_ROOT, repo, 'meta.json');
}

function _readMeta(repo) {
  const p = _metaPathForRepo(repo);
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p,'utf8')||'{}') || {}; } catch (e) {}
  return {};
}

function _writeMeta(repo, meta) {
  const p = _metaPathForRepo(repo);
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(meta, null, 2), 'utf8');
    return true;
  } catch (e) { if (DEBUG_FETCH) console.log('persist meta failed', e && e.message); return false; }
}

function _md5(s) {
  try { return crypto.createHash('md5').update(String(s||'')).digest('hex'); } catch (e) { return null; }
}

/**
 * Translates a string to German, reading from and writing to a per-repo meta.json cache.
 * The cache key is md5(text), so identical strings across fields share a single DeepL call.
 * Uses `module.exports.translateToGermanDetailed` (not the local binding) so tests can
 * mock the DeepL call without replacing the whole module.
 *
 * @param {string} repo - Repository name used to locate the meta.json cache file
 * @param {string} text - Text to translate
 * @returns {Promise<{ text: string|null, status: string }>}
 */
async function translateWithCache(repo, text) {
  if (!text) return { text: null, status: 'no-text' };
  try {
    const meta = _readMeta(repo) || {};
    meta.translation = meta.translation || {};
    meta.translation.cache = meta.translation.cache || {};
    // md5(text) as the cache key so identical strings across fields share one DeepL call
    const key = _md5(text);
    if (!key) return { text: null, status: 'hash-failed' };
    const cached = meta.translation.cache[key];
    if (cached && typeof cached === 'string') return { text: cached, status: 'cached' };
    if (cached && cached.text) return { text: cached.text, status: 'cached' };
    const res = await module.exports.translateToGermanDetailed(text);
    if (res && res.text) {
      meta.translation.cache[key] = res.text;
      _writeMeta(repo, meta);
    }
    return res;
  } catch (e) {
    if (DEBUG_FETCH) console.log('translateWithCache failed', e && e.message);
    return { text: null, status: 'error', error: (e && e.message) || String(e) };
  }
}

module.exports = { translateToGermanDetailed, shouldTranslateUI, translateWithCache };

// attach orchestrator when present
try {
  const orchestrator = require('./translationOrchestrator');
  module.exports.orchestrator = orchestrator;
} catch (e) { /* ignore if not present */ }
