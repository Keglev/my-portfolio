const persistence = require('../../../../scripts/lib/media/persistence');

describe('media persistence', () => {
  test('exports persistMetaForNode', () => {
    expect(typeof persistence.persistMetaForNode).toBe('function');
  });
});
