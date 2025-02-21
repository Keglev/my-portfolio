import axios from 'axios'; // Import Axios for making HTTP requests

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
    // Send a POST request to the GitHub API with the GraphQL query
    const response = await axios.post(
      GITHUB_API_URL,
      { query },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`, // Use the GitHub token for authentication
        },
      }
    );
    
    console.log("GitHub API Response:", response.data.data.user.pinnedItems.nodes.map(repo => ({
      name: repo.name,
      readme: repo.object ? repo.object.text : "No README found"
    }))); // Log the API response for debugging

    // Return the array of pinned repositories data from the API response
    return response.data.data.user.pinnedItems.nodes;
  } catch (error) {
    // Handle errors during the API request and log relevant error information
    console.error('Error fetching pinned repositories:', error.response ? error.response.data : error);
    return []; // Return an empty array in case of an error
  }
};
