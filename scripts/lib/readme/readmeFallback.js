#!/usr/bin/env node
let axios = null;
function getAxios() {
  if (axios) return axios;
  try { const _a = require('axios'); axios = _a && _a.default ? _a.default : _a; return axios; } catch (e) { axios = null; return null; }
}

/**
 * Fetches the raw README.md text for a repository by trying each branch in order.
 * Used as a fallback when the GraphQL response does not include the README object.
 *
 * @param {string} org - GitHub organization or username
 * @param {string} repo - Repository name
 * @param {string[]} [branches=['main','master']] - Branch names to try in order
 * @param {number} [timeout=8000] - Request timeout in milliseconds
 * @returns {Promise<string|null>} Raw README text, or null if all branches fail
 */
async function fetchReadmeFromRaw(org, repo, branches = ['main','master'], timeout = 8000) {
  const ax = getAxios(); if (!ax) return null;
  for (const br of branches) {
    try {
      const url = `https://raw.githubusercontent.com/${org}/${repo}/${br}/README.md`;
      const r = await ax.get(url, { responseType: 'text', timeout });
      if (r && r.status === 200 && r.data) return r.data;
    } catch (e) { /* ignore */ }
  }
  return null;
}

module.exports = { fetchReadmeFromRaw };
