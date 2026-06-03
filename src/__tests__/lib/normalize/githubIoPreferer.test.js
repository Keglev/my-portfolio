const { tryGithubIo } = require('../../../../scripts/lib/normalize/githubIoPreferer');
 
const makeAxios = (status, contentType, xFrameOptions = '') => ({
  head: jest.fn().mockResolvedValue({
    status,
    headers: {
      'content-type': contentType,
      ...(xFrameOptions ? { 'x-frame-options': xFrameOptions } : {}),
    },
  }),
});
 
describe('tryGithubIo', () => {
  test('returns null if href is falsy', async () => {
    expect(await tryGithubIo({ name: 'repo' }, null, () => null, false)).toBeNull();
    expect(await tryGithubIo({ name: 'repo' }, '', () => null, false)).toBeNull();
  });
 
  test('returns null if href does not match raw.githubusercontent /docs/ pattern', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/README.md';
    const result = await tryGithubIo({ name: 'repo' }, href, () => makeAxios(200, 'text/html'), false);
    expect(result).toBeNull();
  });
 
  test('returns github.io URL when HEAD returns 200 text/html', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/index.html';
    const ax = makeAxios(200, 'text/html');
    const result = await tryGithubIo({ name: 'repo' }, href, () => ax, false);
    expect(result).toMatch(/keglev\.github\.io\/repo/);
  });
 
  test('prepends bare github.io URL when afterDocs is empty (index.html stripped)', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/index.html';
    const ax = makeAxios(200, 'text/html');
    const result = await tryGithubIo({ name: 'repo' }, href, () => ax, false);
    expect(result).toBeTruthy();
  });
 
  test('returns null when HEAD returns 200 but x-frame-options is DENY', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/api.html';
    const ax = makeAxios(200, 'text/html', 'DENY');
    const result = await tryGithubIo({ name: 'repo' }, href, () => ax, false);
    expect(result).toBeNull();
  });
 
  test('returns null when HEAD returns non-200 status', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/api.html';
    const ax = makeAxios(404, 'text/html');
    const result = await tryGithubIo({ name: 'repo' }, href, () => ax, false);
    expect(result).toBeNull();
  });
 
  test('returns null when HEAD returns 200 but content-type is not html', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/api.html';
    const ax = makeAxios(200, 'application/json');
    const result = await tryGithubIo({ name: 'repo' }, href, () => ax, false);
    expect(result).toBeNull();
  });
 
  test('skips candidate and continues when getAxios returns null', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/api.html';
    const result = await tryGithubIo({ name: 'repo' }, href, () => null, false);
    expect(result).toBeNull();
  });
 
  test('returns null when HEAD throws', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/api.html';
    const ax = { head: jest.fn().mockRejectedValue(new Error('network error')) };
    const result = await tryGithubIo({ name: 'repo' }, href, () => ax, false);
    expect(result).toBeNull();
  });
 
  test('works with master branch in href', async () => {
    const href = 'https://raw.githubusercontent.com/keglev/repo/master/docs/guide.html';
    const ax = makeAxios(200, 'text/html');
    const result = await tryGithubIo({ name: 'repo' }, href, () => ax, false);
    expect(result).toMatch(/keglev\.github\.io\/repo/);
  });
});
 