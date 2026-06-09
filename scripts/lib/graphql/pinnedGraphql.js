#!/usr/bin/env node
const fetchGithub = require('../fetchGithub');

const QUERY = `query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12, types: [REPOSITORY]) { nodes { __typename ... on Repository { name description url } } } } }`;

/**
 * Fetches the first 12 pinned repository nodes for a GitHub user via GraphQL.
 * Delegates to runGraphQL so the same auth-test and error-handling flow applies.
 *
 * @param {string} token - GitHub personal access token
 * @param {string} [login='keglev'] - GitHub username whose pinned repos to fetch
 * @returns {Promise<object[]>} Array of raw repository nodes
 */
async function fetchPinnedNodes(token, login = 'keglev') {
  if (!fetchGithub || !fetchGithub.runGraphQL) throw new Error('fetchGithub.runGraphQL not available');
  return fetchGithub.runGraphQL(token, QUERY, { login });
}

module.exports = { fetchPinnedNodes };
