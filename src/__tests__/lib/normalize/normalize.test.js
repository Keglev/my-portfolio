const { toRawGithub, normalizeRepoDocsLinks } = require('../../../../scripts/lib/normalize/normalize');

describe('normalize', () => {
  test('exports helpers', () => {
    expect(typeof toRawGithub).toBe('function');
    expect(typeof normalizeRepoDocsLinks).toBe('function');
  });
});
