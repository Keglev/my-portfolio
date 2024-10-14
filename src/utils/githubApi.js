import axios from 'axios';

// GitHub GraphQL API endpoint
const GITHUB_API_URL = 'https://api.github.com/graphql';

// Access your GitHub token securely via environment variables
const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

/**
 * Fetch pinned repositories from GitHub using GraphQL.
 * @returns {Promise<Array>} Array of pinned repositories with their description and README content.
 */
export const fetchPinnedRepositories = async () => {
  const query = `
    {
      user(login: "keglev") {
        pinnedItems(first: 6, types: [REPOSITORY]) {
          nodes {
            ... on Repository {
              name
              description
              url
              object(expression: "HEAD:README.md") {
                ... on Blob {
                  text
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      GITHUB_API_URL,
      { query },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,  // Using the token to authenticate
        },
      }
    );
    
    console.log("GitHub API Response:", response.data);  // Log the full response

    // Return the pinned repositories data
    return response.data.data.user.pinnedItems.nodes;
  } catch (error) {
    console.error('Error fetching pinned repositories:', error.response ? error.response.data : error);
    return [];
  }
};
