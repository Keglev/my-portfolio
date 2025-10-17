/**
 * fetchGithub.runGraphQL
 * Lazily require axios at call-time to avoid test runners attempting to parse ESM entrypoints
 */

/**
 * runGraphQL - perform a GitHub GraphQL query with a token and return normalized nodes
 * @param {string} token - GitHub token (Bearer)
 * @param {string} query - GraphQL query string
 * @param {object} [variables] - Optional variables object for the query
 * @param {object} [opts] - Optional options { timeout }
 * @returns {Promise<Array>} nodes array (pinnedItems.nodes or repositories.nodes)
 */
async function runGraphQL(token, query, variables = { login: 'keglev' }, opts = {}) {
  // Lazy-load axios so Jest or other tooling doesn't parse the module at import time
  let axios;
  try {
    // eslint-disable-next-line global-require
    axios = require('axios');
  } catch (e) {
    throw new Error('fetchGithub: failed to require axios (is it installed?): ' + (e && e.message));
  }

  const DEBUG = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
  const timeout = (opts && opts.timeout) || 10000;
  const payload = (typeof query === 'string' && query.includes('$')) ? { query, variables } : { query };

  // Quick auth test to surface auth problems early
  try {
    if (DEBUG) console.log('fetchGithub: running auth test');
    const testQ = '{ viewer { login } }';
    const testRes = await axios.post('https://api.github.com/graphql', { query: testQ }, { headers: { Authorization: token ? `Bearer ${token}` : undefined }, timeout: 8000 });
    if (!testRes || !testRes.data || !testRes.data.data || !testRes.data.data.viewer) {
      if (DEBUG) console.log('fetchGithub: auth test response', testRes && testRes.data);
      throw new Error('GraphQL auth test failed');
    }
  } catch (e) {
    throw new Error('GraphQL auth/test query failed: ' + (e && e.message));
  }

  try {
    if (DEBUG) console.log('fetchGithub: sending query, variables:', variables);
    const res = await axios.post('https://api.github.com/graphql', payload, { headers: { Authorization: token ? `Bearer ${token}` : undefined }, timeout });
    if (DEBUG) try { console.log('fetchGithub: response status', res && res.status); } catch (err) {}
    if (res && res.data && res.data.errors && res.data.errors.length) {
      throw new Error('GraphQL errors: ' + JSON.stringify(res.data.errors));
    }

    const body = res && res.data ? res.data : null;
    const user = body && body.data && body.data.user;
    let nodes = null;
    if (user) {
      if (user.pinnedItems && Array.isArray(user.pinnedItems.nodes)) nodes = user.pinnedItems.nodes;
      else if (user.repositories && Array.isArray(user.repositories.nodes)) nodes = user.repositories.nodes;
    }

    if (!Array.isArray(nodes)) {
      throw new Error('Invalid GraphQL response: ' + JSON.stringify(body));
    }
    return nodes;
  } catch (err) {
    if (err && err.response && err.response.data) {
      throw new Error('GraphQL request failed: ' + JSON.stringify(err.response.data, null, 2));
    }
    throw new Error((err && err.message) || String(err));
  }
}

module.exports = { runGraphQL };
