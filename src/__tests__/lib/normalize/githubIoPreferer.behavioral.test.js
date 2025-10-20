const { tryGithubIo } = require('../../../../scripts/lib/normalize/githubIoPreferer');

describe('githubIoPreferer behavioral', () => {
  test('returns null if axios not available', async () => {
    const node = { name: 'sample' };
    const res = await tryGithubIo(node, null, () => null, false);
    expect(res).toBeNull();
  });

  test('returns candidate when axios head returns HTML', async () => {
    const node = { name: 'sample' };
    const fakeAxios = {
      head: async (url, opts) => ({ status: 200, headers: { 'content-type': 'text/html' } })
    };
  const href = 'https://raw.githubusercontent.com/keglev/sample/main/docs/index.html';
    const res = await tryGithubIo(node, href, () => fakeAxios, false);
    expect(res).toBeTruthy();
    expect(res).toMatch(/keglev.github.io/);
  });
});
