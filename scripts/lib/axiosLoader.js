// require('axios') is deferred to call-time so test runners that parse CJS builds
// don't trip over the axios ESM entry point before it's needed.
let _axios = null;

/**
 * Returns a shared axios instance, requiring it lazily on first call.
 * Returns null when axios is not installed so callers can skip network calls gracefully.
 *
 * @returns {import('axios').AxiosInstance|null}
 */
function getAxios() {
  if (_axios) return _axios;
  try {
    // eslint-disable-next-line global-require
    const mod = require('axios');
    _axios = mod && mod.default ? mod.default : mod;
    return _axios;
  } catch (e) { return null; }
}

module.exports = { getAxios };
