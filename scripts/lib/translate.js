const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
let axios = null;
function getAxios() {
  if (axios) return axios;
  try { const _a = require('axios'); axios = _a && _a.default ? _a.default : _a; return axios; } catch (e) { axios = null; return null; }
}
const DEEPL_KEY = process.env.DEEPL_API_KEY || process.env.DEEPL_KEY || process.env.DEEPL_SECRET;

async function translateToGermanDetailed(text) {
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

function shouldTranslateUI(s, maxLen = 300) {
  try { return s && typeof s === 'string' && s.trim().length > 0 && s.trim().length <= maxLen; } catch (e) { return false; }
}

module.exports = { translateToGermanDetailed, shouldTranslateUI };

const fs = require('fs');
const path = require('path');

// Default media root used for per-repo meta persistence. Can be overridden in tests via TRANSLATE_MEDIA_ROOT env var.
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

// Translate with per-repo persistent cache. Keyed by original text.
async function translateWithCache(repo, text) {
  if (!text) return { text: null, status: 'no-text' };
  try {
    const meta = _readMeta(repo) || {};
    meta.translation = meta.translation || {};
    meta.translation.cache = meta.translation.cache || {};
    const cached = meta.translation.cache[text];
    if (cached) return { text: cached, status: 'cached' };
  const res = await module.exports.translateToGermanDetailed(text);
    if (res && res.text) {
      meta.translation.cache[text] = res.text;
      _writeMeta(repo, meta);
    }
    return res;
  } catch (e) {
    if (DEBUG_FETCH) console.log('translateWithCache failed', e && e.message);
    return { text: null, status: 'error', error: (e && e.message) || String(e) };
  }
}

module.exports = Object.assign(module.exports, { translateWithCache });
