/**
 * Tests for config/jest/styleMock.js
 * This mock is used by Jest to handle CSS imports
 */

describe('styleMock', () => {
  let styleMock;

  beforeEach(() => {
    // Clear the require cache to ensure fresh import
    delete require.cache[require.resolve('../../../../config/jest/styleMock')];
    styleMock = require('../../../../config/jest/styleMock');
  });

  it('should export an object', () => {
    expect(typeof styleMock).toBe('object');
  });

  it('should export an empty object', () => {
    expect(styleMock).toEqual({});
  });

  it('should have no properties', () => {
    expect(Object.keys(styleMock).length).toBe(0);
  });

  it('should be a plain object', () => {
    expect(Object.getPrototypeOf(styleMock)).toBe(Object.prototype);
  });

  it('should be consistent across multiple imports', () => {
    delete require.cache[require.resolve('../../../../config/jest/styleMock')];
    const styleMock2 = require('../../../../config/jest/styleMock');
    expect(styleMock).toEqual(styleMock2);
  });

  it('should allow dynamic property assignment', () => {
    styleMock.testProp = 'testValue';
    expect(styleMock.testProp).toBe('testValue');
  });
});
