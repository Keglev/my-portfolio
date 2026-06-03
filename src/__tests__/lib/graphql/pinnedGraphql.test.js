const { fetchPinnedNodes } = require('../../../../scripts/lib/graphql/pinnedGraphql');
 
jest.mock('../../../../scripts/lib/fetchGithub', () => ({
  runGraphQL: jest.fn(),
}));
 
const fetchGithub = require('../../../../scripts/lib/fetchGithub');
 
describe('pinnedGraphql', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
 
  test('exports fetchPinnedNodes as a function', () => {
    expect(typeof fetchPinnedNodes).toBe('function');
  });
 
  test('throws if fetchGithub.runGraphQL is not available', async () => {
    fetchGithub.runGraphQL = undefined;
    await expect(fetchPinnedNodes('token')).rejects.toThrow(
      'fetchGithub.runGraphQL not available'
    );
  });
 
  test('calls runGraphQL with token and default login', async () => {
    const mockNodes = [{ name: 'repo1' }];
    fetchGithub.runGraphQL = jest.fn().mockResolvedValue(mockNodes);
 
    const result = await fetchPinnedNodes('my-token');
 
    expect(fetchGithub.runGraphQL).toHaveBeenCalledWith(
      'my-token',
      expect.stringContaining('getPinned'),
      { login: 'keglev' }
    );
    expect(result).toBe(mockNodes);
  });
 
  test('calls runGraphQL with explicit login override', async () => {
    const mockNodes = [{ name: 'repo2' }];
    fetchGithub.runGraphQL = jest.fn().mockResolvedValue(mockNodes);
 
    const result = await fetchPinnedNodes('my-token', 'other-user');
 
    expect(fetchGithub.runGraphQL).toHaveBeenCalledWith(
      'my-token',
      expect.any(String),
      { login: 'other-user' }
    );
    expect(result).toBe(mockNodes);
  });
 
  test('propagates errors thrown by runGraphQL', async () => {
    fetchGithub.runGraphQL = jest.fn().mockRejectedValue(new Error('network error'));
 
    await expect(fetchPinnedNodes('my-token')).rejects.toThrow('network error');
  });
});

