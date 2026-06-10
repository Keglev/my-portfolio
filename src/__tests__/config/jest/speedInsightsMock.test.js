/** Tests for config/jest/speedInsightsMock.js — verifies SpeedInsights renders null and ignores all props. */

describe('speedInsightsMock', () => {
  let speedInsightsMock;

  beforeEach(() => {
    delete require.cache[require.resolve('../../../../config/jest/speedInsightsMock')];
    speedInsightsMock = require('../../../../config/jest/speedInsightsMock');
  });

  it('should export an object', () => {
    expect(typeof speedInsightsMock).toBe('object');
  });

  it('should export a SpeedInsights property', () => {
    expect(speedInsightsMock).toHaveProperty('SpeedInsights');
  });

  it('should export SpeedInsights as a function', () => {
    expect(typeof speedInsightsMock.SpeedInsights).toBe('function');
  });

  it('should return null when SpeedInsights is called', () => {
    expect(speedInsightsMock.SpeedInsights()).toBeNull();
  });

  it('should return null regardless of props passed', () => {
    const { SpeedInsights } = speedInsightsMock;
    expect(SpeedInsights({ framework: 'react', route: '/home' })).toBeNull();
  });

  it('should be consistent across multiple imports', () => {
    delete require.cache[require.resolve('../../../../config/jest/speedInsightsMock')];
    const mock2 = require('../../../../config/jest/speedInsightsMock');
    expect(typeof mock2.SpeedInsights).toBe('function');
    expect(mock2.SpeedInsights()).toBeNull();
  });
});
