/**
 * Tests for config/jest/fileMock.js
 * This mock is used by Jest to handle static file imports (images, media, etc.)
 */

describe('fileMock', () => {
  let fileMock;

  beforeEach(() => {
    // Clear the require cache to ensure fresh import
    delete require.cache[require.resolve('../../../../config/jest/fileMock')];
    fileMock = require('../../../../config/jest/fileMock');
  });

  it('should export a string stub', () => {
    expect(typeof fileMock).toBe('string');
  });

  it('should export the correct stub value', () => {
    expect(fileMock).toBe('test-file-stub');
  });

  it('should be consistent across multiple imports', () => {
    delete require.cache[require.resolve('../../../../config/jest/fileMock')];
    const fileMock2 = require('../../../../config/jest/fileMock');
    expect(fileMock).toBe(fileMock2);
  });

  it('should allow the stub to be used in module imports', () => {
    // Simulate how Jest would use this stub in moduleNameMapper
    const importedAsModule = fileMock;
    expect(importedAsModule).toBeDefined();
    expect(importedAsModule).toEqual('test-file-stub');
  });
});
