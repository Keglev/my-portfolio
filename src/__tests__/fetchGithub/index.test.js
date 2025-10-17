jest.mock('axios', () => ({ post: jest.fn() }));

const { runGraphQL } = require('../../../scripts/lib/fetchGithub');
const axios = jest.requireMock('axios');

describe('fetchGithub.runGraphQL', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns nodes when GraphQL responds with pinnedItems', async () => {
    // Mock auth test (viewer)
    axios.post = jest.fn().mockImplementation((url, payload) => {
      if (payload && payload.query && payload.query.includes('viewer')) {
        return Promise.resolve({ data: { data: { viewer: { login: 'keglev' } } } });
      }
      // Main query returning pinnedItems
      return Promise.resolve({ data: { data: { user: { pinnedItems: { nodes: [ { __typename: 'Repository', name: 'repo1', description: 'desc', url: 'https://github.com/Keglev/repo1' } ] } } } } });
    });

    const nodes = await runGraphQL(null, 'query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12) { nodes { name } } } }', { login: 'keglev' });
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0].name).toBe('repo1');
  });
});
