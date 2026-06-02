jest.mock('axios', () => ({ post: jest.fn() }));

describe('githubApi.fetchPinnedRepositories', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const loadModule = () => require('../../utils/githubApi');

  it('returns pinned repository nodes on success', async () => {
    const axios = require('axios');
    axios.post.mockResolvedValue({
      data: {
        data: {
          user: {
            pinnedItems: {
              nodes: [{ name: 'repo-a' }, { name: 'repo-b' }],
            },
          },
        },
      },
    });

    const { fetchPinnedRepositories } = loadModule();
    const nodes = await fetchPinnedRepositories();

    expect(nodes).toEqual([{ name: 'repo-a' }, { name: 'repo-b' }]);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toBe('https://api.github.com/graphql');
  });

  it('returns an empty array and logs a token error for 401 responses', async () => {
    const axios = require('axios');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValue({ response: { status: 401 } });

    const { fetchPinnedRepositories } = loadModule();
    const nodes = await fetchPinnedRepositories();

    expect(nodes).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub token is expired or invalid.');
    consoleErrorSpy.mockRestore();
  });

  it('returns an empty array and logs a generic error for other failures', async () => {
    const axios = require('axios');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValue(new Error('boom'));

    const { fetchPinnedRepositories } = loadModule();
    const nodes = await fetchPinnedRepositories();

    expect(nodes).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching pinned repositories:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});