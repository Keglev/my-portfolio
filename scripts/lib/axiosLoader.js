// Shared lazy-loader for axios. require('axios') is deferred to call-time so
// test runners that parse CJS builds don't trip over the ESM entry point.
let _axios = null;

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
