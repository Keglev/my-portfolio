const { translateNode } = require('../../../../scripts/lib/translation/translatorFacade');

describe('translatorFacade', () => {
  test('exports translateNode', () => {
    expect(typeof translateNode).toBe('function');
  });
});
