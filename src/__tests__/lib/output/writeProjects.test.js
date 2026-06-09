// Verifies writeProjectsJson: correct output file path, JSON serialization,
// and the fs.writeFileSync invocation with the expected arguments.
jest.mock('fs');
const fs = require('fs');
const { writeProjectsJson } = require('../../../../scripts/lib/output/writeProjects');

describe('writeProjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exports writeProjectsJson as a function', () => {
    expect(typeof writeProjectsJson).toBe('function');
  });

  test('writes serialised JSON to the given path', () => {
    const nodes = [{ name: 'repo-a' }, { name: 'repo-b' }];
    writeProjectsJson('/out/projects.json', nodes);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/out/projects.json',
      JSON.stringify(nodes, null, 2),
      'utf8'
    );
  });

  test('writes an empty array without throwing', () => {
    writeProjectsJson('/out/projects.json', []);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/out/projects.json',
      '[]',
      'utf8'
    );
  });

  test('propagates fs errors to the caller', () => {
    fs.writeFileSync.mockImplementation(() => { throw new Error('disk full'); });
    expect(() => writeProjectsJson('/out/projects.json', [])).toThrow('disk full');
  });
});
