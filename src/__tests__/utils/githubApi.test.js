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

// ── axios.default resolution ──────────────────────────────────────────────────
// Tests the `_axios && _axios.default ? _axios.default : _axios` branch by
// providing a mock whose exports object has a `.default` property.

describe('githubApi – axios.default branch', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('uses axios.default when the required module exposes a .default export', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      data: {
        data: { user: { pinnedItems: { nodes: [{ name: 'repo-default' }] } } },
      },
    });
    jest.doMock('axios', () => ({ default: { post: mockPost }, __esModule: true }));

    const { fetchPinnedRepositories } = require('../../utils/githubApi');
    const nodes = await fetchPinnedRepositories();

    jest.unmock('axios');
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(nodes).toEqual([{ name: 'repo-default' }]);
  });

  it('returns empty array and logs error when axios require throws', async () => {
    jest.doMock('axios', () => { throw new Error('module not found'); });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { fetchPinnedRepositories } = require('../../utils/githubApi');
    const nodes = await fetchPinnedRepositories();

    jest.unmock('axios');
    consoleSpy.mockRestore();
    expect(nodes).toEqual([]);
  });
});