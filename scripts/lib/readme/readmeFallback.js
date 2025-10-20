#!/usr/bin/env node
let axios = null;
function getAxios() {
  if (axios) return axios;
  try { const _a = require('axios'); axios = _a && _a.default ? _a.default : _a; return axios; } catch (e) { axios = null; return null; }
}

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
