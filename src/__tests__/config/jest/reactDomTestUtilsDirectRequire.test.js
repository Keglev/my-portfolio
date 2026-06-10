/* eslint-env jest */
/** Tests for config/jest/react-dom-test-utils.js — exercises direct require with and without React available. */
describe('react-dom-test-utils direct require', () => {
  const modPath = '../../../../config/jest/react-dom-test-utils';

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('exports act from React when React is present', () => {
    const mod = require(modPath);
    expect(mod).toHaveProperty('act');
  });

  it('uses fallback act when requiring while React throws', () => {
    jest.resetModules();
    // doMock + isolateModules ensures the mocked registry is used when loading the module
    jest.doMock('react', () => { throw new Error('module not found'); });

    jest.isolateModules(() => {
      const mod = require(modPath);
      expect(mod).toHaveProperty('act');

      let ran = false;
      const res = mod.act(() => { ran = true; return 'fallback'; });
      expect(ran).toBe(true);
      return expect(Promise.resolve(res)).resolves.toBe('fallback');
    });
  });
});
