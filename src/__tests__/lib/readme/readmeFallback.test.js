const { fetchReadmeFromRaw } = require('../../../../scripts/lib/readme/readmeFallback');

describe('readmeFallback', () => {
  test('exports fetchReadmeFromRaw', () => {
    expect(typeof fetchReadmeFromRaw).toBe('function');
  });
});
