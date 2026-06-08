const { getAxios } = require('./axiosLoader');

async function runAuthTest(axios, token, debug, timeout) {
  const testRes = await axios.post(
    'https://api.github.com/graphql',
    { query: '{ viewer { login } }' },
    { headers: { Authorization: token ? `Bearer ${token}` : undefined }, timeout: timeout || 8000 }
  );
  if (!testRes || !testRes.data || !testRes.data.data || !testRes.data.data.viewer) {
    if (debug) console.log('fetchGithub: auth test response', testRes && testRes.data);
    throw new Error('GraphQL auth test failed');
  }
}

async function runGraphQL(token, query, variables = { login: 'keglev' }, opts = {}) {
  const axios = getAxios();
  if (!axios) throw new Error('fetchGithub: failed to require axios (is it installed?)');

  const DEBUG = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
  const timeout = (opts && opts.timeout) || 10000;
  const payload = (typeof query === 'string' && query.includes('$')) ? { query, variables } : { query };

  try {
    if (DEBUG) console.log('fetchGithub: running auth test');
    await runAuthTest(axios, token, DEBUG, timeout);
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
    if (!Array.isArray(nodes)) throw new Error('Invalid GraphQL response: ' + JSON.stringify(body));
    return nodes;
  } catch (err) {
    if (err && err.response && err.response.data) {
      throw new Error('GraphQL request failed: ' + JSON.stringify(err.response.data, null, 2));
    }
    throw new Error((err && err.message) || String(err));
  }
}

module.exports = { runGraphQL };
