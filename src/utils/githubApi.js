const GITHUB_API_URL = 'https://api.github.com/graphql';
const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

// README is fetched from raw.githubusercontent.com per-repo to avoid GraphQL blob
// parsing edge-cases and token exposure in query payloads.
const PINNED_REPOS_QUERY = `
  query getPinned {
    user(login: "keglev") {
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes { __typename ... on Repository { name description url } }
      }
    }
  }
`;

// axios publishes ESM and CJS; require() resolves to CJS in Jest to avoid import errors.
// eslint-disable-next-line global-require
function getAxios() {
  const mod = require('axios');
  return mod.default ? mod.default : mod;
}

export const fetchPinnedRepositories = async () => {
  try {
    const axios = getAxios();
    const response = await axios.post(
      GITHUB_API_URL,
      { query: PINNED_REPOS_QUERY },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    return response.data.data.user.pinnedItems.nodes;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('GitHub token is expired or invalid.');
    } else {
      console.error('Error fetching pinned repositories:', error);
    }
    return [];
  }
};
