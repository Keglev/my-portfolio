const { extractSummaryFromNode } = require('../../../../scripts/lib/summary/summaryExtractor');

describe('summaryExtractor', () => {
  test('exports extractSummaryFromNode', () => {
    expect(typeof extractSummaryFromNode).toBe('function');
  });
});
