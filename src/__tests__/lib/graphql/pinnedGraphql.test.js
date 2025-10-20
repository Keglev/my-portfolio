const { fetchPinnedNodes } = require('../../../../scripts/lib/graphql/pinnedGraphql');

describe('pinnedGraphql', () => {
  test('exports fetchPinnedNodes', () => {
    expect(typeof fetchPinnedNodes).toBe('function');
  });
});
