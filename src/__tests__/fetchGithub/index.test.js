// Verifies runGraphQL: happy-path node extraction, auth failure branches, main query
// error handling, response shape variants, variable inclusion, and DEBUG_FETCH logging.
jest.mock('axios', () => ({ post: jest.fn() }));

const { runGraphQL } = require('../../../scripts/lib/fetchGithub');
const axios = jest.requireMock('axios');

function mockAuthThenQuery(mainResponse) {
  axios.post = jest.fn().mockImplementation((url, payload) => {
    if (payload && payload.query && payload.query.includes('viewer')) {
      return Promise.resolve({ data: { data: { viewer: { login: 'user' } } } });
    }
    return Promise.resolve(mainResponse);
  });
}

describe('fetchGithub.runGraphQL', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns nodes when GraphQL responds with pinnedItems', async () => {
    mockAuthThenQuery({ data: { data: { user: { pinnedItems: { nodes: [{ __typename: 'Repository', name: 'repo1', description: 'desc', url: 'https://github.com/Keglev/repo1' }] } } } } });

    const nodes = await runGraphQL(null, 'query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12) { nodes { name } } } }', { login: 'keglev' });
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0].name).toBe('repo1');
  });

  // ── auth failure branches ─────────────────────────────────────────────────

  test('throws when auth test response has no viewer field', async () => {
    axios.post = jest.fn().mockResolvedValue({ data: { data: {} } });
    await expect(
      runGraphQL('token', '{ user { pinnedItems { nodes { name } } } }')
    ).rejects.toThrow('GraphQL auth/test query failed');
  });

  test('throws when auth test axios.post rejects', async () => {
    axios.post = jest.fn().mockRejectedValue(new Error('network error'));
    await expect(
      runGraphQL('token', '{ user { pinnedItems { nodes { name } } } }')
    ).rejects.toThrow('GraphQL auth/test query failed: network error');
  });

  // ── main query error branches ─────────────────────────────────────────────

  test('throws "GraphQL errors" when response body contains an errors array', async () => {
    mockAuthThenQuery({ data: { errors: [{ message: 'field not found' }] } });
    await expect(
      runGraphQL('token', '{ user { pinnedItems { nodes { name } } } }')
    ).rejects.toThrow('GraphQL errors');
  });

  test('throws "Invalid GraphQL response" when response has no nodes', async () => {
    mockAuthThenQuery({ data: { data: { user: null } } });
    await expect(
      runGraphQL('token', '{ user { pinnedItems { nodes { name } } } }')
    ).rejects.toThrow('Invalid GraphQL response');
  });

  test('throws "GraphQL request failed" when main axios.post rejects with response data', async () => {
    const err = new Error('Bad request');
    err.response = { data: { message: 'Forbidden', status: 403 } };
    axios.post = jest.fn().mockImplementation((url, payload) => {
      if (payload && payload.query && payload.query.includes('viewer')) {
        return Promise.resolve({ data: { data: { viewer: { login: 'user' } } } });
      }
      return Promise.reject(err);
    });
    await expect(
      runGraphQL('token', '{ user { pinnedItems { nodes { name } } } }')
    ).rejects.toThrow('GraphQL request failed');
  });

  // ── repositories.nodes branch ─────────────────────────────────────────────

  test('returns nodes from user.repositories.nodes when pinnedItems is absent', async () => {
    mockAuthThenQuery({ data: { data: { user: { repositories: { nodes: [{ name: 'repo-a' }] } } } } });
    const nodes = await runGraphQL('token', '{ user { repositories { nodes { name } } } }');
    expect(nodes).toEqual([{ name: 'repo-a' }]);
  });

  // ── payload: with vs without variables ───────────────────────────────────

  test('includes variables in payload when query string contains "$"', async () => {
    mockAuthThenQuery({ data: { data: { user: { pinnedItems: { nodes: [] } } } } });
    await runGraphQL('token', 'query($login: String!) { user(login: $login) { pinnedItems { nodes { name } } } }', { login: 'keglev' }).catch(() => {});
    const mainPayload = axios.post.mock.calls[1][1];
    expect(mainPayload.variables).toBeDefined();
    expect(mainPayload.variables.login).toBe('keglev');
  });

  test('omits variables from payload when query string has no "$"', async () => {
    mockAuthThenQuery({ data: { data: { user: { pinnedItems: { nodes: [] } } } } });
    await runGraphQL('token', '{ user { pinnedItems { nodes { name } } } }').catch(() => {});
    const mainPayload = axios.post.mock.calls[1][1];
    expect(mainPayload.variables).toBeUndefined();
  });

  // ── DEBUG_FETCH=true logging branches ────────────────────────────────────

  describe('when DEBUG_FETCH is set', () => {
    let logSpy;

    beforeEach(() => {
      process.env.DEBUG_FETCH = '1';
      logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      delete process.env.DEBUG_FETCH;
      logSpy.mockRestore();
    });

    test('logs debug messages when query succeeds', async () => {
      axios.post = jest.fn().mockImplementation((url, payload) => {
        if (payload && payload.query && payload.query.includes('viewer')) {
          return Promise.resolve({ status: 200, data: { data: { viewer: { login: 'keglev' } } } });
        }
        return Promise.resolve({
          status: 200,
          data: { data: { user: { pinnedItems: { nodes: [{ name: 'repo1' }] } } } },
        });
      });
      await runGraphQL('token', 'query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12) { nodes { name } } } }', { login: 'keglev' });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('running auth test'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('sending query'), expect.anything());
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('response status'), expect.anything());
    });

    test('logs auth test response when viewer is missing', async () => {
      axios.post = jest.fn().mockResolvedValue({ data: { data: {} } });
      await runGraphQL('token', '{ user { name } }').catch(() => {});
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('auth test response'),
        expect.anything()
      );
    });
  });

  // ── custom timeout ────────────────────────────────────────────────────────

  test('passes custom timeout from opts to the main axios.post call', async () => {
    mockAuthThenQuery({ data: { data: { user: { pinnedItems: { nodes: [] } } } } });
    await runGraphQL('token', '{ user { pinnedItems { nodes { name } } } }', { login: 'u' }, { timeout: 3000 }).catch(() => {});
    const mainOpts = axios.post.mock.calls[1][2];
    expect(mainOpts.timeout).toBe(3000);
  });
});
