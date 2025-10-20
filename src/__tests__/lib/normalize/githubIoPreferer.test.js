const { tryGithubIo } = require('../../../../scripts/lib/normalize/githubIoPreferer');

describe('githubIoPreferer', () => {
  test('exports tryGithubIo', () => {
    expect(typeof tryGithubIo).toBe('function');
  });
});
