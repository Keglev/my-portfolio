// Verifies fetchReadmeFromRaw: successful README fetch via raw URL, 404
// handling, and the axios.default branch resolved by getAxios().
jest.mock('axios', () => ({
  get: jest.fn(),
  default: { get: jest.fn() },
}));

describe('readmeFallback – fetchReadmeFromRaw', () => {
  let fetchReadmeFromRaw;
  let axiosGet;

  beforeEach(() => {
    jest.resetModules();
    ({ fetchReadmeFromRaw } = require('../../../../scripts/lib/readme/readmeFallback'));
    // getAxios() prefers _a.default when it exists, so mock via .default.get
    axiosGet = require('axios').default.get;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── exports ──────────────────────────────────────────────────────────────

  test('exports fetchReadmeFromRaw as a function', () => {
    expect(typeof fetchReadmeFromRaw).toBe('function');
  });

  // ─── happy path ───────────────────────────────────────────────────────────

  test('returns readme content when main branch responds 200', async () => {
    axiosGet.mockResolvedValue({ status: 200, data: '# Hello World' });

    const result = await fetchReadmeFromRaw('keglev', 'my-repo');

    expect(result).toBe('# Hello World');
  });

  test('constructs correct raw.githubusercontent.com URL for main branch', async () => {
    axiosGet.mockResolvedValue({ status: 200, data: '# Hello' });

    await fetchReadmeFromRaw('keglev', 'my-repo');

    expect(axiosGet).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/keglev/my-repo/main/README.md',
      expect.objectContaining({ responseType: 'text' })
    );
  });

  test('passes responseType "text" and default timeout 8000 to axios', async () => {
    axiosGet.mockResolvedValue({ status: 200, data: '# Hello' });

    await fetchReadmeFromRaw('keglev', 'my-repo');

    expect(axiosGet).toHaveBeenCalledWith(expect.any(String), {
      responseType: 'text',
      timeout: 8000,
    });
  });

  test('passes custom timeout to axios', async () => {
    axiosGet.mockResolvedValue({ status: 200, data: '# Hello' });

    await fetchReadmeFromRaw('keglev', 'my-repo', ['main'], 3000);

    expect(axiosGet).toHaveBeenCalledWith(expect.any(String), {
      responseType: 'text',
      timeout: 3000,
    });
  });

  // ─── branch fallback ──────────────────────────────────────────────────────

  test('tries master branch after main fails', async () => {
    axiosGet
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValue({ status: 200, data: '# From master' });

    const result = await fetchReadmeFromRaw('keglev', 'my-repo');

    expect(result).toBe('# From master');
    expect(axiosGet).toHaveBeenCalledTimes(2);
    expect(axiosGet).toHaveBeenNthCalledWith(
      2,
      'https://raw.githubusercontent.com/keglev/my-repo/master/README.md',
      expect.any(Object)
    );
  });

  test('returns data from first successful branch without trying others', async () => {
    axiosGet.mockResolvedValue({ status: 200, data: '# From main' });

    const result = await fetchReadmeFromRaw('keglev', 'my-repo', ['main', 'master']);

    expect(result).toBe('# From main');
    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  test('accepts a custom branches list', async () => {
    axiosGet
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue({ status: 200, data: '# From dev' });

    const result = await fetchReadmeFromRaw('keglev', 'my-repo', ['main', 'dev']);

    expect(result).toBe('# From dev');
    expect(axiosGet).toHaveBeenNthCalledWith(
      2,
      'https://raw.githubusercontent.com/keglev/my-repo/dev/README.md',
      expect.any(Object)
    );
  });

  // ─── null / failure cases ─────────────────────────────────────────────────

  test('returns null when all branches throw network errors', async () => {
    axiosGet.mockRejectedValue(new Error('network error'));

    const result = await fetchReadmeFromRaw('keglev', 'my-repo');

    expect(result).toBeNull();
  });

  test('returns null when response status is not 200', async () => {
    axiosGet.mockResolvedValue({ status: 404, data: 'Not Found' });

    const result = await fetchReadmeFromRaw('keglev', 'my-repo');

    expect(result).toBeNull();
  });

  test('returns null when response has empty data', async () => {
    axiosGet.mockResolvedValue({ status: 200, data: '' });

    const result = await fetchReadmeFromRaw('keglev', 'my-repo');

    expect(result).toBeNull();
  });

  test('returns null when response object is falsy', async () => {
    axiosGet.mockResolvedValue(null);

    const result = await fetchReadmeFromRaw('keglev', 'my-repo');

    expect(result).toBeNull();
  });

  // ─── axios unavailable ────────────────────────────────────────────────────

  test('returns null when axios cannot be required', async () => {
    jest.resetModules();
    jest.doMock('axios', () => { throw new Error('module not found'); });
    const { fetchReadmeFromRaw: fn } = require('../../../../scripts/lib/readme/readmeFallback');

    const result = await fn('keglev', 'my-repo');

    expect(result).toBeNull();
    jest.dontMock('axios');
  });
});
