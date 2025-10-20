const { processNodeReadme } = require('../../../../scripts/lib/readme/readmeHandler');

describe('readmeHandler', () => {
  test('exports processNodeReadme', () => {
    expect(typeof processNodeReadme).toBe('function');
  });
});
