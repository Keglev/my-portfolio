const writer = require('../../../../scripts/lib/output/writeProjects');

describe('writeProjects', () => {
  test('exports writeProjectsJson', () => {
    expect(typeof writer.writeProjectsJson).toBe('function');
  });
});
