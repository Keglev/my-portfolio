// axios publishes both ESM and CJS. For Jest (and some test runners) require() resolves
// to the CJS build which avoids `import` parsing errors. Use a safe resolution here.
let axios;
try {
  // Prefer require so tests load the CJS build from axios' exports
  // eslint-disable-next-line global-require
  const _axios = require('axios');
  axios = _axios && _axios.default ? _axios.default : _axios;
} catch (e) {
  // Fallback to dynamic import - in runtime environments that support ESM this will work
  // (rare in CRA test env), but the require path above should handle Jest.
  // eslint-disable-next-line no-undef
  axios = undefined;
}

// GitHub GraphQL API endpoint
const GITHUB_API_URL = 'https://api.github.com/graphql';

// Access your GitHub token securely via environment variables
const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

/**
 * Fetch pinned repositories from GitHub using GraphQL.
 * This function sends a POST request to the GitHub API using a GraphQL query
 * to retrieve the user's pinned repositories, their descriptions, and their README content.
 *
 * @returns {Promise<Array>} Array of pinned repositories with their name, description, URL, and README content.
 */
export const fetchPinnedRepositories = async () => {
  // GraphQL query to get the first 6 pinned repositories for the user 'keglev'
  // NOTE: We purposely do NOT request the README blob via GraphQL here. The client will
  // fetch README content from raw.githubusercontent.com per-repo when needed to avoid
  // exposing tokens or triggering GraphQL blob parsing edge-cases.
  const query = `
    query getPinned { user(login: "keglev") { pinnedItems(first: 6, types: [REPOSITORY]) { nodes { __typename ... on Repository { name description url } } } } }
  `;

  try {
    // Send a POST request to the GitHub API with the GraphQL query
    if (!axios) {
      // As a last resort, dynamically import axios in environments that support ESM
      // (this should not be hit in Jest if require worked)
      // eslint-disable-next-line no-undef
      const imported = await import('axios');
      axios = imported && imported.default ? imported.default : imported;
    }

    const response = await axios.post(
      GITHUB_API_URL,
      { query },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`, // Use the GitHub token for authentication
          "X-GitHub-Api-Version": "2022-11-28", // Specify the API version
        },
      }
    );
    // Return the array of pinned repositories data from the API response
    return response.data.data.user.pinnedItems.nodes;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error("GitHub token is expired or invalid.");
    } else {
      console.error('Error fetching pinned repositories:', error);
    }
    return []; // Return an empty array so Projects.js can show an error message
  }
};
