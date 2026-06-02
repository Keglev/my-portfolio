const { stripAstJsonFragments } = require('../../../../scripts/lib/docs/extractReadmeDocs');

describe('stripAstJsonFragments', () => {
  it('returns the original value for non-strings and cleans JSON fragments from strings', () => {
    expect(stripAstJsonFragments(null)).toBeNull();
    expect(stripAstJsonFragments(undefined)).toBeUndefined();
    expect(stripAstJsonFragments('Intro {"type":"paragraph"} text')).toBe('Intro text');
    expect(stripAstJsonFragments('   ')).toBeNull();
  });
});