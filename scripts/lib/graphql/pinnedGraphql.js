#!/usr/bin/env node
const fetchGithub = require('../fetchGithub');

const QUERY = `query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12, types: [REPOSITORY]) { nodes { __typename ... on Repository { name description url } } } } }`;

async function fetchPinnedNodes(token, login = 'keglev') {
  if (!fetchGithub || !fetchGithub.runGraphQL) throw new Error('fetchGithub.runGraphQL not available');
  return fetchGithub.runGraphQL(token, QUERY, { login });
}

module.exports = { fetchPinnedNodes };
